import { createClient } from 'redis'
import { createFieldsFromResponses } from '../functions/sheetFormatting.js'
import { REDIS_URL } from './config.js'
import { GRADERS } from './graders.js'

const APP_NAMESPACE = 'app'
const USER_NAMESPACE = 'user'
const GRADE_NAMESPACE = 'grade'
const LOCKS_SET = 'locks'
const UNION_STORE_SET = 'locks:u:apps'
const TO_GRADE_SET = 'apps:tograde'
const APPS_SET = 'apps'

const LOCK_SECONDS = 1199

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
	newClient.zRangeStore

	await newClient.connect()
	console.log('initialized redis')
	client = newClient
}

function getSecondsRemaining(expireTime) {
	const now = new Date()
	const secondsRemaining = (expireTime - now.getTime()) / 1000
	return secondsRemaining.toFixed()
}

const getUserStoredLock = async (user) => {
	const value = await client.GET(`${USER_NAMESPACE}:${user}`)
	if (!value) {
		return {}
	}

	const [applicationId, expireTime] = value.split(':')
	return { applicationId, expireTime }
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
		.set(`${APP_NAMESPACE}:${id}`, responsesString)
		.ZADD(APPS_SET, { score: 0, value: id }, { NX: true })
		.EXEC()
}

/**
 * Retrieve and lock an application that is eligible to be reviewed.
 * @param user an id string for the user checking out the app
 * @returns an { applicationId, expireTime } object
 */
async function checkoutRandomApp(user) {
	const now = new Date()

	// Get time that the application will expire
	const graderConfig = GRADERS.find(({ id }) => user.toLowerCase() === id.toLowerCase())
	const secondsToGrade = graderConfig?.secondsToGrade ? graderConfig.secondsToGrade : LOCK_SECONDS
	const expireTime = now.getTime() + secondsToGrade * 1000

	// Get a random application that is not currently locked
	const getUnlockedAppReplies = await client
		.multi()
		.ZREMRANGEBYSCORE(LOCKS_SET, -Infinity, now.getTime())
		.ZRANGESTORE(TO_GRADE_SET, APPS_SET, 0, 2, { BY: 'SCORE' })
		.ZDIFFSTORE(UNION_STORE_SET, TO_GRADE_SET, LOCKS_SET)
		.ZRANDMEMBER(UNION_STORE_SET)
		.DEL(UNION_STORE_SET)
		.DEL(TO_GRADE_SET)
		.EXEC()
	const unlockedApplicationId = getUnlockedAppReplies[3]
	if (!unlockedApplicationId) {
		console.log(`All applications locked. Either you forgot to init the db, or we're almost done!`)
		return null
	}

	const lockAttempt = await client.ZADD(
		LOCKS_SET,
		{ score: expireTime, value: unlockedApplicationId },
		{ NX: true }
	)
	if (lockAttempt === 0) {
		// If the lock failed, try again
		// This should only happen if another thread tried to lock the same app after the diff step
		console.log(`Lock attempt failed for ${user} on application ${unlockedApplicationId}. Retrying`)
		return checkoutRandomApp(user)
	} else if (lockAttempt === 1) {
		// If it succeeded, set the lock asynchronously, then return the app
		client
			.SET(`${USER_NAMESPACE}:${user}`, `${unlockedApplicationId}:${expireTime}`)
			.catch((err) => {
				console.error(err)
			})
		return { applicationId: unlockedApplicationId, expireTime }
	}

	console.error(`ERROR: Lock attempt on ${unlockedApplicationId} returned: ${lockAttempt}`)
	return null
}

/**
 * Check if the user has a locked application, and return it if so.
 * @param user an id string for the user checking out the app
 * @returns an application object if the user has a lock, null otherwise
 */
async function getLockedApp(user) {
	// Check if user has app checked out and if they still have the lock on it
	const { applicationId, expireTime: userStoredExpireTime } = await getUserStoredLock(user)
	if (!applicationId) {
		console.log(`User ${user} has no locks.`)
		return null
	}

	const expireTime = await client.ZSCORE(LOCKS_SET, applicationId)
	if (!expireTime) {
		console.log(`User ${user} used to have a lock on ${applicationId}, now gone (likely expired).`)
		return null
	}

	if (expireTime !== parseInt(userStoredExpireTime)) {
		console.log(`User ${user} has a lock, but ${userStoredExpireTime} doesn't match ${expireTime}`)
		return null
	}

	if (expireTime > new Date().getTime()) {
		console.log(`User ${user} has a lock on ${applicationId}.`)
		return { applicationId, expireTime }
	}

	console.log(`Existing lock on ${applicationId} is expired.`)
	return null
}

async function getLockedAppOrCheckoutRandom(user) {
	// Get locked application if one exists
	const application = await getLockedApp(user)
	if (application) {
		return application
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
	await initializeClient()
	if (!user) {
		throw `Invalid argument: provided user was ${user}`
	}

	const { applicationId, expireTime } = await getLockedAppOrCheckoutRandom(user)
	const responsesJson = await client.GET(`${APP_NAMESPACE}:${applicationId}`)

	return {
		fields: createFieldsFromResponses(JSON.parse(responsesJson)),
		applicationId,
		secondsRemaining: getSecondsRemaining(expireTime)
	}
}

export async function loadApplications(applications) {
	await initializeClient()
	const promises = applications.map(setApp)
	return await Promise.all(promises)
}

export async function deleteLock(user) {
	await initializeClient()
	const lock = await getLockedApp(user)
	if (lock) {
		const results = await client
			.multi()
			.SET(`${USER_NAMESPACE}:${user}`, '')
			.ZREM(LOCKS_SET, lock.applicationId)
			.EXEC()

		if (results[0] !== 'OK' || results[1] !== 1) {
			console.warn(`Unexpected delete results: ${results}`)
		}
		return Promise.resolve(true)
	}
	console.log(`User ${user} requested to delete a lock, but none found.`)
	return Promise.resolve(true)
}

export async function submitGrade(user, body) {
	await initializeClient()
	console.log(`User ${user} is submitting a grade.`)
	const value = JSON.stringify(body)

	// Get stored lock (even if it's expired) because it's the application the user is seeeing
	const { applicationId } = await getUserStoredLock(user)
	if (typeof applicationId !== 'string' || !applicationId) {
		throw `Unexpected applicationId ${applicationId}`
	}

	const results = await client
		.multi()
		.SET(`${GRADE_NAMESPACE}:${applicationId}:${user}`, value)
		.ZINCRBY(APPS_SET, 1, applicationId)
		.EXEC()
	console.log(results)

	const deleteRes = await deleteLock(user) // Not transaction-safe, fix in rewrite
	console.log(`Delete result: ${deleteRes}`)
	return applicationId
}
