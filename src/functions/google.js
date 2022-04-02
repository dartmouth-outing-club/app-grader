import path from 'path'
import { google } from 'googleapis'
import { getPrompts, getRandomApp } from './sheetFormatting'

const APPLICATIONS_SHEET_ID = '1PSSCaNH5eSvloLrKVxnSfm9V9tTmulY5qsgpXjUOToU'
const SPREADSHEET_AUTH_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

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
 * By default, will retry once on an error.
 * @returns a google sheet
 */
export async function getApplication(retry = true) {
	if (!sheets) {
		await setToken()
	}

	// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/sheets
	let applicationsSheet
	try {
		const res = await sheets.spreadsheets.get({
			spreadsheetId: APPLICATIONS_SHEET_ID,
			includeGridData: true
		})
		applicationsSheet = res.data.sheets[0]
	} catch (error) {
		if (error?.response?.status === 401) {
			// Attempt to re-authenticate if the arror was auth related
			console.error('Auth error, attempting to log back in')
			await setToken()
		} else {
			// Otherwise wait 2 seconds and then try again
			console.error(error)
			await sleepSeconds(2)
		}

		// Attempt a single retry
		if (retry) {
			return getApplication(false)
		}
		throw 'Attempting to get the application twice failed'
	}

	// Get the questions and a single response
	const questions = getPrompts()
	const responses = getRandomApp(applicationsSheet)

	// Return array of { question, response } objects
	return questions.map((question, index) => ({ question, response: responses[index] }))
}
