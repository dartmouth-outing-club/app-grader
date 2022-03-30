import path from 'path'
import { google, sheets_v4 } from 'googleapis'
import { getPrompts, getRandomApp } from './data/formatters'

// https://github.com/googleapis/google-api-nodejs-client/blob/main/samples/jwt.js
const APPLICATIONS_SHEET_ID = '1PSSCaNH5eSvloLrKVxnSfm9V9tTmulY5qsgpXjUOToU'
const SPREADSHEET_AUTH_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

let sheets: sheets_v4.Sheets

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

export async function getApplication() {
	if (!sheets) {
		await setToken()
	}

	let applicationsSheet: sheets_v4.Schema$Sheet
	try {
		const res = await sheets.spreadsheets.get({
			spreadsheetId: APPLICATIONS_SHEET_ID,
			includeGridData: true
		})
		applicationsSheet = res.data.sheets[0]
	} catch (error) {
		if (error?.response?.status === 401) {
			console.error('Auth error, attempting to log back in')
			setToken()
		} else {
			console.error(error)
		}
		return
	}

	// Get the questions and a single response
	const questions = getPrompts()
	const responses = getRandomApp(applicationsSheet)

	// Return array of { question, response } objects
	return questions.map((question, index) => ({ question, response: responses[index] }))
}
