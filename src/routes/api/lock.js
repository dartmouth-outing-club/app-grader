import { verifyJwt } from '../../modules/clientAuth.js'
import { deleteLock, getApplicationForUser } from '../../modules/redis.js'

const ERROR_RES = {
	status: 500,
	body: {
		message: 'Sorry, something went wrong. Please try again later.'
	}
}
const EMPTY_RES = { status: 204 }
const ACCESS_DENIED_RES = { status: 403 }

async function getUserFromJwt(event) {
	const headers = event?.request?.headers
	const authorization = headers.get('Authorization')

	try {
		return verifyJwt(authorization.replace('Bearer ', ''))
	} catch (err) {
		console.warn(`Invalid JWT provided by ${event.clientAddress}`)
		console.warn(err)
		throw 'ACCESS_DENIED'
	}
}

export async function post(event) {
	// Verify user's JWT
	let userId
	try {
		userId = await getUserFromJwt(event)
	} catch {
		return ACCESS_DENIED_RES
	}

	// Attempt to get an application for the user
	let application
	try {
		application = await getApplicationForUser(userId)
	} catch (err) {
		console.error(err)
		return ERROR_RES
	}

	// If it came back empty, that means there's no applications
	const { applicationId, fields } = application
	if (!applicationId) {
		return EMPTY_RES
	}

	console.log(`Serving application ${applicationId} to ${userId}`)
	const body = { application: fields }

	return {
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	}
}

export async function del(event) {
	// Verify user's JWT
	let userId
	try {
		userId = await getUserFromJwt(event)
	} catch {
		return ACCESS_DENIED_RES
	}
	console.log(`Deleting lock for ${userId}`)
	await deleteLock(userId)
	return EMPTY_RES
}
