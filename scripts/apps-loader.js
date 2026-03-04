/**
 * apps-loader.js - loads the applications sheet into the database
 */
import process from 'node:process'
import fs from 'node:fs'
import * as csv from 'csv-parse/sync'
import * as sqlite from '../src/modules/sqlite-accessor.js'
import { columnLetterToArrayIndex } from '../src/functions/sheetFormatting.js'
import { APP_CONFIG } from '../src/modules/config.js'

const DB_FILEPATH = process.env.DB_FILEPATH || './app-grader.db'

if (process.argv.length !== 3) {
  console.error('Usage: node apps-loader.js [SHEET_FP]')
  process.exit(1)
}

const path = process.argv[2]
console.log(path)
const file = fs.readFileSync(path, { columns: false, skip_empty_lines: true })

const skipRows = APP_CONFIG.skipRows
const netidIndex = columnLetterToArrayIndex(APP_CONFIG.netIdColumn)
const questions_start = columnLetterToArrayIndex(APP_CONFIG.questionsStartColumn)
const questions_end = questions_start + APP_CONFIG.questions.length

let apps = csv.parse(file).slice(skipRows).map(row => {
  const additional_data = APP_CONFIG.additionalData.map(datum => {
    const datumIndex = columnLetterToArrayIndex(datum.column)
    const value = row[datumIndex]
    return { key: datum.key, value }
  })
  return {
    applicationId: row[netidIndex],
    responses: row.slice(questions_start, questions_end),
    additional_data
  }
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
