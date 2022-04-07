import { getApplicationForUser } from '../../modules/redis'

const ERROR_RES = {
	status: 500,
	body: {
		message: 'Sorry, something went wrong. Please try again later.'
	}
}
const EMPTY_RES = {
	status: 204
}

export async function get({ clientAddress }) {
	// Attempt to get an application for the user
	let application
	try {
		application = await getApplicationForUser(clientAddress)
	} catch {
		return ERROR_RES
	}

	// If it came back empty, that means there's no applications
	const { applicationId, fields, secondsRemaining } = application
	if (!applicationId) {
		return EMPTY_RES
	}

	console.log(`Serving application ${applicationId} to ${clientAddress}`)
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
