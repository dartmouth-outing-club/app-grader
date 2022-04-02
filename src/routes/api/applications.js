import { getApplication } from '../../functions/google'

const ERROR_RES = {
	status: 500,
	error: 'Internal Server Error',
	message: 'Sorry, please try again later.'
}

export async function get() {
	const application = await getApplication()

	if (!application) {
		return ERROR_RES
	}

	const body = {
		application,
		secondsRemaining: 1200
	}

	return {
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	}
}
