import fs from 'node:fs'
import child_process from 'node:child_process'

const DB_FILEPATH = process.env.DB_FILEPATH || './app-grader.db'

if (!fs.existsSync(DB_FILEPATH)) {
  console.log(`Database ${DB_FILEPATH} not found; creating schema`)
  child_process.execSync(`sqlite3 ${DB_FILEPATH} ".read scripts/schema.sql"`)
} else {
  console.log(`Database ${DB_FILEPATH} found; skipping initialization`)
}
