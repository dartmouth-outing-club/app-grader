// Ideally this would not be hardcoded, but we are out of time
export const isTripsApp = (application) => {
	return application.length > 3 && application[3].response
}

export const isCrooApp = (application) => {
	return application.length > 4 && application[4].response
}
