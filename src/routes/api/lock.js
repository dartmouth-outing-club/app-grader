import { getUserFromJwt } from '../../modules/googleClientAuth.js'
import { deleteLock, getApplicationForUser } from '../../modules/redis.js'
import { ACCESS_DENIED_RES, EMPTY_RES, ERROR_RES } from '../../constants/httpConstants.js'

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
	const { applicationId, fields, secondsRemaining } = application
	if (!applicationId) {
		return EMPTY_RES
	}

	console.log(`Serving application ${applicationId} to ${userId}`)
	const body = { application: fields, secondsRemaining }

	return {
		status: 200,
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
