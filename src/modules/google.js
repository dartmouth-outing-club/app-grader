import path from 'path'
import { google } from 'googleapis'
import { getPrompts, getRandomApp } from './sheetFormatting'

const APPLICATIONS_SHEET_ID = '1uOdJTKmFk6xTREViX7-TGcP0CJvg2WWLqhwbzyJBbXg'
const SPREADSHEET_AUTH_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const APPLICATIONS_SHEET_TITLE = 'Applicants'

// Store current authenticated accessor in the module
let sheets

function sleepSeconds(seconds) {
	return new Promise((resolve) => {
		setTimeout(resolve, seconds * 1000)
	})
}

async function setToken() {
	const auth = new google.auth.GoogleAuth({
		keyFile: path.join(process.cwd(), 'jwt.keys.json'),
		scopes: [SPREADSHEET_AUTH_SCOPE]
	})
	const client = await auth.getClient()
	sheets = google.sheets({
		version: 'v4',
		auth: client
	})
}

/**
 * Retrieve the google sheet with all the applications on it.
 * @returns a google sheet
 */
async function getSingleApplication() {
	// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/sheets
	let applicationsSheet
	const res = await sheets.spreadsheets.get({
		spreadsheetId: APPLICATIONS_SHEET_ID,
		includeGridData: true
	})

	// Get the sheet with the applicants
	applicationsSheet = res.data.sheets.find(
		(sheet) => sheet.properties.title === APPLICATIONS_SHEET_TITLE
	)

	// Get the questions and a single response
	const questions = getPrompts()
	const { responses, applicationId } = getRandomApp(applicationsSheet)

	// Create array of { question, response } objects
	const fields = questions.map((question, index) => ({ question, response: responses[index] }))

	return {
		fields,
		applicationId
	}
}

/**
 * Enhance a function by retrying it a certain number of times,
 * with a login attempt to google if necessary.
 */
async function enhanceWithRetry(retriesLeft, func, ...params) {
	if (!sheets) {
		await setToken()
	}

	try {
		return func(...params)
	} catch (error) {
		if (error?.response?.status === 401) {
			// Attempt to re-authenticate if the arror was auth related
			console.error('Auth error; attempting to log back in')
			await setToken()
		} else {
			// Otherwise wait 2 seconds and then try again
			console.error(error)
			await sleepSeconds(2)
		}

		// Attempt a single retry
		if (retriesLeft > 0) {
			return enhanceWithRetry(retriesLeft - 1, func, ...params)
		}
		throw `Attempting to call ${func} twice failed`
	}
}

// TODO: this could probably be made more elegant
// ES6 syntax doesn't let you export a name and declare it in one step
export const getApplication = (...params) => enhanceWithRetry(2, getSingleApplication, ...params)
