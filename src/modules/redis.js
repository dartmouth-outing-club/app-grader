import { createClient } from 'redis'
import { createFieldsFromResponses } from '../functions/sheetFormatting.js'
import { REDIS_URL } from './config.js'

const USER_NAMESPACE = 'user'
const LOCK_NAMESPACE = 'lock'
const APP_NAMESPACE = 'app'
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

async function checkoutApp(applicationId, user) {
	const lockKey = `${LOCK_NAMESPACE}:${applicationId}`
	const userKey = `${USER_NAMESPACE}:${user}`
	const replies = await client
		.multi()
		.set(userKey, applicationId)
		.set(lockKey, user)
		.EXPIRE(lockKey, LOCK_SECONDS)
		.get(`${APP_NAMESPACE}:${applicationId}`)
		.EXEC()
	return replies[replies.length - 1]
}

const getRandomAppId = async () => client.SRANDMEMBER(APPS_SET)

export async function getOrCheckoutApp(user) {
	await initializeClient()
	// Check if user has app checked out and if they still have the lock on it

	// const appId = await client.get(`${USER_NAMESPACE}:${user}`)
	// const lock = await client.get(`${LOCK_NAMESPACE}:${appId}`)

	// If the user has the lock, give them that app
	// if (lock === user) {
	// 	return await client.get(appId)
	// }

	// Get a random app
	const applicationId = await getRandomAppId()
	const responsesJson = await checkoutApp(applicationId, user)
	return {
		fields: createFieldsFromResponses(JSON.parse(responsesJson)),
		applicationId
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
		.sAdd(APPS_SET, id)
		.EXEC()
}

export async function loadApplications(applications) {
	await initializeClient()
	const promises = applications.map(setApp)
	return await Promise.all(promises)
}
