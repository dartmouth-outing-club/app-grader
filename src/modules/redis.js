import { createClient } from 'redis'
import { createFieldsFromResponses } from '../functions/sheetFormatting.js'
import { REDIS_URL } from './config.js'

const USER_NAMESPACE = 'user'
const LOCKS_SET = 'locks'
const APP_NAMESPACE = 'app'
const UNION_STORE_SET = 'locks:u:apps'
const APPS_SET = 'apps'

const LOCK_SECONDS = 1200

// https://devcenter.heroku.com/articles/connecting-heroku-redis#connecting-in-node-js
const DEV_CONFIG = { url: 'redis://localhost:6379' }
const PROD_CONFIG = { url: REDIS_URL, socket: { tls: true, rejectUnauthorized: false } }

let client
async function initializeClient() {
	if (client) {
		return
	}

	const newClient = createClient(process.env.NODE_ENV === 'development' ? DEV_CONFIG : PROD_CONFIG)
	newClient.on('error', (err) => console.error('Redis Client Error', err))

	await newClient.connect()
	console.log('initialized redis')
	client = newClient
}

function getSecondsRemaining(expireTime) {
	const now = new Date()
	const secondsRemaining = (expireTime - now.getTime()) / 1000
	return secondsRemaining.toFixed()
}

async function checkoutRandomApp(user) {
	const now = new Date()
	const expireTime = now.getTime() + LOCK_SECONDS * 1000

	// Get a random application that is not currently locked
	const getUnlockedAppReplies = await client
		.multi()
		.ZREMRANGEBYSCORE(LOCKS_SET, -Infinity, now.getTime())
		.ZDIFFSTORE(UNION_STORE_SET, APPS_SET, LOCKS_SET)
		.ZRANDMEMBER(UNION_STORE_SET)
		.DEL(UNION_STORE_SET)
		.EXEC()
	const unlockedApplicationId = getUnlockedAppReplies[2]
	if (!unlockedApplicationId) {
		console.log(`All applications locked. Either you forgot to init the db, or we're almost done!`)
		return null
	}

	const lockAttempt = await client.ZADD(
		LOCKS_SET,
		{ score: expireTime, value: unlockedApplicationId },
		{ NX: true }
	)
	console.log(lockAttempt)
	if (lockAttempt === 0) {
		// If the lock failed, try again
		// This should only happen if another thread tried to lock the same app after the diff step
		console.log(`Lock attempt failed for ${user} on application ${unlockedApplicationId}. Retrying`)
		return checkoutRandomApp(user)
	} else if (lockAttempt === 1) {
		// If it succeeded, set the lock asynchronously, then return the app
		client.SET(`${USER_NAMESPACE}:${user}`, unlockedApplicationId).catch((err) => {
			console.error(err)
		})
		return { applicationId: unlockedApplicationId, expireTime }
	}

	console.error(`ERROR: Lock attempt on ${unlockedApplicationId} returned: ${lockAttempt}`)
	return null
}

const getRandomAppId = async () => client.ZRANDMEMBER(APPS_SET)

export async function getLockedAppOrCheckoutRandom(user) {
	await initializeClient()
	// Check if user has app checked out and if they still have the lock on it
	const lockedApplicationId = await client.get(`${USER_NAMESPACE}:${user}`)
	if (lockedApplicationId) {
		const [expireTime] = await client.ZMSCORE(LOCKS_SET, lockedApplicationId)
		if (expireTime && expireTime > new Date().getTime()) {
			console.log(`User ${user} requested ${lockedApplicationId} for which they have a lock.`)
			return { applicationId: lockedApplicationId, expireTime }
		}
	}

	// If there's no lock or an expired one, checkout a new app
	// Note that we didn't remove the expired lock; this function will take care of that
	const { applicationId, expireTime } = await checkoutRandomApp(user)

	// If the app fails to get an application, return an empty object
	if (applicationId === null) {
		return {}
	}

	return { applicationId, expireTime }
}

export async function getApplicationForUser(user) {
	const { applicationId, expireTime } = await getLockedAppOrCheckoutRandom(user)
	const responsesJson = await client.GET(`${APP_NAMESPACE}:${applicationId}`)

	return {
		fields: createFieldsFromResponses(JSON.parse(responsesJson)),
		applicationId,
		secondsRemaining: getSecondsRemaining(expireTime)
	}
}

/**
 * Add the app responses to the redis database.
 * Note that this adds the app twice, once where `app:appId` is the key to the application,
 * and once to a set of appIds that can be used to grab a random one.
 *
 * @param application the formatted application object
 * @returns a Promise that will resolve to the redis client's responses
 */
function setApp(application) {
	const id = application.applicationId
	const responsesString = JSON.stringify(application.responses)

	return client
		.multi()
		.set(`${APP_NAMESPACE}:${id}`, responsesString, { NX: true })
		.ZADD(APPS_SET, { score: 0, value: id })
		.EXEC()
}

export async function loadApplications(applications) {
	await initializeClient()
	const promises = applications.map(setApp)
	return await Promise.all(promises)
}
