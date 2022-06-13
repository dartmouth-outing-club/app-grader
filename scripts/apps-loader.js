/**
 * apps-loader.js - loads the applications sheet into the database
 */
import { getAllApps } from '../src/functions/sheetFormatting.js'
import { getAppsSheet } from '../src/modules/googleServiceAcc.js'
import { loadApplications } from '../src/modules/sqlite-accessor.js'

if (process.argv.length != 3) {
  console.error('Usage: node apps-loader.js [SHEET OFFSET]')
  process.exit(1)
}

// Get the applications from the google sheet
const [offset] = process.argv[2]
const sheet = await getAppsSheet()
const applications = getAllApps(sheet, offset)
console.log(`Pulled ${applications.length} applications`)

// Load the applications into SQLite
const responses = loadApplications(applications)
console.log('sqlite responses:', ...responses)
process.exit(0)
