export const fetchApplication = async (credential) => {
	return fetch('/api/application', {
		headers: {
			Authorization: `Bearer ${credential}`
		}
	})
}
