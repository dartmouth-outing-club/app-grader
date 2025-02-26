import express from 'express'
import nunjucks from 'nunjucks'

import * as authentication from './authentication.js'
import * as sqlite from './modules/sqlite-accessor.js'
import * as index from './routes/index.js'
import * as grades from './routes/grades.js'
import * as locks from './routes/locks.js'

const { getUser, requireUser } = authentication

const _30_DAYS_IN_MS = 2592000000

process.env.TZ = 'America/New_York'

const DB_FILEPATH = process.env.DB_FILEPATH || 'app-grader.db'

const router = express.Router()

router.get('/', getUser, index.get)
router.post('/login', authentication.loginUser)
router.post('/logout', authentication.logoutUser)

router.get('/grades', requireUser, grades.get)
router.post('/grades', requireUser, grades.post)

router.get('/locks', requireUser, locks.get)
router.post('/locks', requireUser, locks.post)
router.delete('/locks', requireUser, locks.del)

const app = express()
nunjucks
  .configure('templates', { express: app })
  .addGlobal('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID)
app.set('views', '/templates')
app.use('/htmx', express.static('node_modules/htmx.org/dist', { maxAge: _30_DAYS_IN_MS }))
app.use('/favicon.ico', express.static('src/static/favicon.ico', { maxAge: _30_DAYS_IN_MS }))

app.use(express.urlencoded({ extended: false }))
app.use('/', router)
app.use(handleError)

sqlite.start(DB_FILEPATH)
process.on('exit', () => {
  sqlite.stop()
})
process.on('SIGHUP', () => process.exit(128 + 1))
process.on('SIGINT', () => process.exit(128 + 2))
process.on('SIGTERM', () => process.exit(128 + 15))

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 3000
app.listen(port)
console.log(`Server running at http://localhost:${port}`)
console.error(`Starting up at ${new Date()}`)

function handleError(err, req, res, _next) {
  switch (err.name) {
    case 'BadRequestError':
      return res.status(400).send(err.message)
    default:
      console.error(`Unexpected error for ${req.method} ${req.url}, sending 500`)
      console.error(err.stack)
      console.error(req.body)
  }

  return res.status(500).send('Sorry, the App Grader experienced an error. Please reach to OPO.')
}
