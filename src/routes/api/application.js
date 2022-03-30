import { getApplication } from '../../google'

const ERROR_RES = {
	status: 500,
	error: 'Internal Server Error',
	message: 'Sorry, please try again'
}

export async function get() {
	const application = await getApplication()

	if (!application) {
		return ERROR_RES
	}

	return {
		body: JSON.stringify(application),
		headers: {
			'Content-Type': 'application/json'
		}
	}
}
