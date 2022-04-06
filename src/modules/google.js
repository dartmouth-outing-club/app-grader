import path from 'path'
import { google } from 'googleapis'

const APPLICATIONS_SHEET_ID = '1X31_BF8Ffl39ZeGPF75MrvenKH4UIO5k6j3pwInw0NM'
const SPREADSHEET_AUTH_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const APPLICATIONS_SHEET_TITLE = 'responses'

// Store current authenticated accessor in the module. This gets created once, on import.
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
 * Return a function that will attempt to refresh the OAuth token if it fails.
 *
 * Every function that needs to call the Google API will have to authenticate using OAuth.
 * This function lets us write all the other functions assuming that the `sheets` variable
 * exists and is authenticated, then ehance those functions with retry and login logic.
 */
function enhanceWithRetries(func, retries) {
	return async (...params) => {
		if (!sheets) {
			await setToken()
		}

		let triesLeft = retries + 1
		while (triesLeft > 0) {
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
					console.error('Retrying the call again.')
				}
			}
			triesLeft -= 1
		}

		throw `Attempting to call ${func} failed ${retries} time(s).`
	}
}

/**
 * Retrieve the google sheet with all the applications on it.
 * @returns a google sheet
 */
async function getApplicationsSheet() {
	// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/sheets
	let applicationsSheet
	const res = await sheets.spreadsheets.get({
		spreadsheetId: APPLICATIONS_SHEET_ID,
		includeGridData: true
	})

	// Get the sheet with the applicants
	// console.debug(`Retrieved ${res.data.sheets.length} sheets`)
	applicationsSheet = res.data.sheets.find(
		(sheet) => sheet.properties.title === APPLICATIONS_SHEET_TITLE
	)

	return applicationsSheet
}

// ES6 syntax doesn't let you export a name and declare it in one step
export const getSheet = enhanceWithRetries(getApplicationsSheet, 2)
