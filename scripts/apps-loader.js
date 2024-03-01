/**
 * apps-loader.js - loads the applications sheet into the database
 */
import process from 'node:process'
import { getAllApps } from '../src/functions/sheetFormatting.js'
import { getAppsSheet } from '../src/modules/googleServiceAcc.js'
import * as sqlite from '../src/modules/sqlite-accessor.js'

const DB_FILEPATH = process.env.DB_FILEPATH || './app-grader.db'

if (process.argv.length !== 3) {
  console.error('Usage: node apps-loader.js [SHEET OFFSET]')
  process.exit(1)
}


// Get the applications from the google sheet
console.log('Downloading responses from google sheet')
const [offset] = process.argv[2]
const sheet = await getAppsSheet()
const applications = getAllApps(sheet, offset)
console.log(`Pulled ${applications.length} applications`)

// Load the applications into SQLite
sqlite.start(DB_FILEPATH)
const responses = sqlite.loadApplications(applications)
console.log('sqlite responses:', ...responses)
sqlite.stop(DB_FILEPATH)
process.exit(0)
