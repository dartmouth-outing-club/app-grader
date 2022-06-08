import { google } from 'googleapis'
import { APP_CONFIG, GOOGLE_SERVICE_KEY } from './config.js'

const APPLICATIONS_SPREADSHEET_ID = APP_CONFIG.sheetId
const SPREADSHEET_AUTH_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const APPLICATIONS_SHEET_TITLE = 'responses'
const GRADING_SHEET_TITLE = 'grades'

// Store current authenticated accessor in the module. This gets created once, on import.
let sheets

function sleepSeconds(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}

async function setToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: GOOGLE_SERVICE_KEY,
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

async function getSheet(sheetTitle) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/sheets
  let applicationsSheet
  const res = await sheets.spreadsheets.get({
    spreadsheetId: APPLICATIONS_SPREADSHEET_ID,
    includeGridData: true
  })

  // Get the sheet with the applicants
  // console.debug(`Retrieved ${res.data.sheets.length} sheets`)
  applicationsSheet = res.data.sheets.find((sheet) => sheet.properties.title === sheetTitle)

  return applicationsSheet
}
/**
 * Retrieve the google sheet with all the applications on it.
 * @returns a google sheet
 */
async function getApplicationsSheet() {
  return getSheet(APPLICATIONS_SHEET_TITLE)
}

/**
 * Add the user's grade to the google sheet
 * @param graderId the user who graded the application
 * @param applicationId the application that was graded
 * @param leaderRubric the list of scores assigned for leader questions
 * @param crooRubric the list of scores assigned for croo questiosn
 * @param freeResponse the qualitative grade of the application
 */
async function addGradeToGradingSheet(
  graderId,
  applicationId,
  freeResponse,
  leaderRubric,
  crooRubric
) {
  // Leader + Croo values must be arrays of length 4, with empty strings if there's no value
  const leaderValues = [...Array(4).keys()].map((index) => leaderRubric[index] || '')
  const crooValues = [...Array(4).keys()].map((index) => crooRubric[index] || '')

  const values = [graderId, applicationId, new Date(), freeResponse, ...leaderValues, ...crooValues]
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
  const request = {
    // The ID of the spreadsheet to update.
    spreadsheetId: APPLICATIONS_SPREADSHEET_ID,
    // The range includes the entire formatted grading sheet
    // Values are appended after the last row of the table.
    range: `'${GRADING_SHEET_TITLE}'!A:L`,
    // Interpret the input data as if a user entered it i.e. convert number strings to numbers
    valueInputOption: 'USER_ENTERED',
    // Append new rows below existing data
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [values] }
  }

  try {
    const response = (await sheets.spreadsheets.values.append(request)).data
    // TODO: Change code below to process the `response` object:
    console.log(JSON.stringify(response, null, 2))
  } catch (err) {
    console.error(err)
  }
}

// ES6 syntax doesn't let you export a name and declare it in one step
export const getAppsSheet = enhanceWithRetries(getApplicationsSheet, 2)
export const addGrade = enhanceWithRetries(addGradeToGradingSheet, 3)
