import { getApplication } from '../../modules/google'
import { getOrCheckoutApp } from '../../modules/redis'

const ERROR_RES = {
	status: 500,
	error: 'Internal Server Error',
	message: 'Sorry, please try again later.'
}

export async function get({ clientAddress }) {
	const { applicationId, fields } = await getApplication()

	if (!applicationId) {
		return ERROR_RES
	}

	await getOrCheckoutApp(applicationId, clientAddress)

	console.log(`Serving application ${applicationId} to ${clientAddress}`)

	const body = {
		application: fields,
		secondsRemaining: 1200
	}

	return {
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	}
}
