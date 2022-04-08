import { verifyJwt } from '../../modules/clientAuth.js'
import { getApplicationForUser } from '../../modules/redis'

const ERROR_RES = {
	status: 500,
	body: {
		message: 'Sorry, something went wrong. Please try again later.'
	}
}
const EMPTY_RES = { status: 204 }
const ACCESS_DENIED_RES = { status: 403 }

export async function get(event) {
	// Verify user's JWT
	const headers = event?.request?.headers
	const authorization = headers.get('Authorization')

	let userId
	try {
		userId = await verifyJwt(authorization.replace('Bearer ', ''))
	} catch (err) {
		console.warn(`Invalid JWT provided by ${event.clientAddress}`)
		console.error(err)
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
	const body = {
		application: fields,
		secondsRemaining
	}

	return {
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	}
}
