import Database from 'better-sqlite3'
import { createFieldsFromResponses } from '../functions/sheetFormatting.js'
import { GRADERS } from './graders.js'

const LOCK_SECONDS = 1199

const db = new Database('./app-grader.db')
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function getSecondsRemaining (expireTime) {
  const now = new Date()
  const secondsRemaining = (expireTime - now.getTime()) / 1000
  return secondsRemaining.toFixed()
}

function getUserStoredLock (user) {
  const lock = db
    .prepare('SELECT application_id, expire_time from locks where grader_id = ?')
    .get(user)
  if (lock) {
    return {
      applicationId: lock.application_id,
      expireTime: lock.expire_time
    }
  }

  return lock || {}
}

/**
 * Retrieve and lock an application that is eligible to be reviewed.
 * @param user an id string for the user checking out the app
 * @returns an { applicationId, expireTime } object
 */
function checkoutRandomApp (user) {
  const now = new Date()

  // Get time that the application will expire
  const graderConfig = GRADERS.find(({ id }) => user.toLowerCase() === id.toLowerCase())
  const secondsToGrade = graderConfig?.secondsToGrade ? graderConfig.secondsToGrade : LOCK_SECONDS
  const expireTime = now.getTime() + secondsToGrade * 1000

  // Get a random application that is not currently locked and has fewer than 3 grades
  const application = db
    .prepare(
      `
    SELECT id, expire_time, IFNULL(num_grades_nullable, 0) as num_grades
    FROM applications
    LEFT JOIN locks on id = locks.application_id
    LEFT JOIN (
        SELECT application_id, count(application_id) as num_grades_nullable
        FROM grades
        GROUP BY application_id
    ) as grades_count on id = grades_count.application_id
    WHERE num_grades < 3 AND (expire_time IS NULL or expire_time < ?)
    ORDER BY RANDOM()
  `
    )
    .get(now.getTime())

  if (!application) {
    console.log('All applications locked. Either you forgot to init the db, or we\'re almost done!')
    return null
  }
  const applicationId = application.id
  console.log(`Retrieved application ${applicationId}`)

  // Because there are no pauses in the function, we don't have to worry that another thread
  // has retrieved the application and is waiting to lock it.
  db.prepare('DELETE FROM locks WHERE application_id = ?').run(applicationId)
  db.prepare('INSERT INTO locks (grader_id, application_id, expire_time) VALUES (?, ?, ?)').run(
    user,
    applicationId,
    expireTime
  )

  return { applicationId, expireTime }
}

/**
 * Check if the user has a locked application, and return it if so.
 * @param user an id string for the user checking out the app
 * @returns an application object if the user has a lock, null otherwise
 */
function getLockedApp (user) {
  // Check if user has app checked out and if they still have the lock on it
  const { applicationId, expireTime } = getUserStoredLock(user)

  if (!applicationId) {
    console.log(`User ${user} has no locks.`)
    return null
  }

  if (expireTime < new Date().getTime()) {
    console.log(`Existing lock on ${applicationId} is expired.`)
    return null
  }

  console.log(`User ${user} has a lock on ${applicationId}.`)
  return { applicationId, expireTime }
}

function getLockedAppOrCheckoutRandom (user) {
  // Get locked application if one exists
  const application = getLockedApp(user)
  if (application) {
    return application
  }

  // If there's no lock or an expired one, checkout a new app
  // Note that we didn't remove the expired lock; this function will take care of that
  const { applicationId, expireTime } = checkoutRandomApp(user)

  // If the app fails to get an application, return an empty object
  if (applicationId === null) {
    return {}
  }

  return { applicationId, expireTime }
}

export function getApplicationForUser (user) {
  if (!user) {
    throw new Error(`Invalid argument: provided user was ${user}`)
  }

  const { applicationId, expireTime } = getLockedAppOrCheckoutRandom(user)
  const applicationJson = db.application_json
    .prepare('SELECT application_json FROM applications WHERE id = ?')
    .get(applicationId)

  return {
    fields: createFieldsFromResponses(JSON.parse(applicationJson)),
    applicationId,
    secondsRemaining: getSecondsRemaining(expireTime)
  }
}

export function loadApplications (applications) {
  return applications.map((application) => {
    const id = application.applicationId
    const applicationJson = JSON.stringify(application.responses)
    return db
      .prepare(
        `
      INSERT INTO applications (id, application_json) VALUES (?, ?)
      ON CONFLICT (id)
        DO UPDATE SET application_json=excluded.application_json`,
        id,
        applicationJson
      )
      .run(id, applicationJson)
  })
}

export function deleteLock (user) {
  const { changes } = db.prepare('DELETE FROM locks WHERE grader_id = ?').run(user)
  if (changes === 0) {
    console.log(`User ${user} requested to delete a lock, but none found.`)
  }
}

export function submitGrade (user, body) {
  // Get stored lock (even if it's expired)
  const { applicationId } = getUserStoredLock(user)
  if (typeof applicationId !== 'string' || !applicationId) {
    throw new Error(`Unexpected applicationId ${applicationId}`)
  }
  JSON.stringify(body)
  db.prepare('INSERT INTO grades (grader_id, application_id, grade_json) VALUES (?, ?, ?)').run(
    user,
    applicationId,
    JSON.stringify(body)
  )
  return applicationId
}
