/**
 * apps-loader.js - loads the applications sheet into the database
 */
import process from 'node:process'
import fs from 'node:fs'
import * as csv from 'csv-parse/sync'
import * as sqlite from '../src/modules/sqlite-accessor.js'

const DB_FILEPATH = process.env.DB_FILEPATH || './app-grader.db'

if (process.argv.length !== 3) {
  console.error('Usage: node apps-loader.js [SHEET_FP]')
  process.exit(1)
}

const path = process.argv[2]
console.log(path)
const file = fs.readFileSync(path, { columns: false, skip_empty_lines: true })
let apps = csv.parse(file).map(row => {
  return { applicationId: row[0], responses: row.slice(1) }
})


// Load the applications into SQLite
sqlite.start(DB_FILEPATH)
const responses = sqlite.loadApplications(apps).reduce(
  (acc, curr) => {
    if (curr.lastInsertRowid > 0) {
      acc.new = acc.new + 1
    } else {
      acc.updated = acc.updated + 1
    }
    return acc
  }, { new: 0, updated: 0 }
)

console.log('succesfully updated applications!')
console.log(`new: ${responses.new}, updated: ${responses.updated}`)

sqlite.stop(DB_FILEPATH)
process.exit(0)
