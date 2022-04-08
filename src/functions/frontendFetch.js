/** Get new application by requesting a lock. */
export const fetchApplication = async (credential) => {
	return fetch('/api/lock', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credential}`
		}
	})
}

/** Delete the existing application and get a new lock. */
export const passApplication = async (credential) => {
	return fetch('/api/lock', {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${credential}`
		}
	})
}
