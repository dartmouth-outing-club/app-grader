import { getOrCheckoutApp } from '../../modules/redis'

const ERROR_RES = {
	status: 500,
	error: 'Internal Server Error',
	message: 'Sorry, please try again later.'
}

export async function get({ clientAddress }) {
	const { applicationId, fields } = await getOrCheckoutApp(clientAddress)

	if (!applicationId) {
		return ERROR_RES
	}

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
