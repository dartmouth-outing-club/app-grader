import { createClient } from 'redis'

const LOCK_NAMESPACE = 'lock'
const LOCK_SECONDS = 1200

// Initialize the client on module load
let client
initializeClient().then((newClient) => {
	client = newClient
})

async function initializeClient() {
	const newClient = createClient()
	newClient.on('error', (err) => console.error('Redis Client Error', err))

	await newClient.connect()
	console.log('initialized redis')
	return newClient
}

async function checkoutApp(applicationId, user) {
	const lockKey = `${LOCK_NAMESPACE}:${applicationId}`
	const replies = await client.multi().set(lockKey, user).expire(lockKey, LOCK_SECONDS).exec()
	console.log(replies)
	return replies
}

export async function getOrCheckoutApp(applicationId, user) {
	return checkoutApp(applicationId, user)
}
