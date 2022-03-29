import { getApplication } from '../../google'

export async function get(event) {
	const sheet = await getApplication()

	return {
		body: JSON.stringify(sheet),
		headers: {
			'Content-Type': 'application/json'
		}
	}
}
