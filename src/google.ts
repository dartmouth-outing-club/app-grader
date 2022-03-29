import path from 'path'
import { google, sheets_v4 } from 'googleapis'
import type { Compute } from 'google-auth-library'
import type { JSONClient } from 'google-auth-library/build/src/auth/googleauth'

// https://github.com/googleapis/google-api-nodejs-client/blob/main/samples/jwt.js
const APPLICATIONS_SHEET_ID = '1PSSCaNH5eSvloLrKVxnSfm9V9tTmulY5qsgpXjUOToU'

let sheets: sheets_v4.Sheets

async function setToken() {
	const auth = new google.auth.GoogleAuth({
		keyFile: path.join(process.cwd(), 'jwt.keys.json'),
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
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

	try {
		const res = await sheets.spreadsheets.get({
			spreadsheetId: APPLICATIONS_SHEET_ID,
			includeGridData: true
		})
		// TODO return array of objects with { question, response }
		return res.data.sheets[0]
	} catch (error) {
		if (error?.response?.status === 401) {
			console.error('Auth error, attempting to log back in')
			setToken()
		}
	}
}
