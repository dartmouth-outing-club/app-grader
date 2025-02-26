import * as csv from 'csv-stringify/sync'
import * as sqlite from '../modules/sqlite-accessor.js'
import * as applicationView from '../application.js'

export async function get(req, res) {
  const { user, is_admin } = req
  const grades = sqlite.getGrades()
  res.render('grades.njk', { user, is_admin, grades })
}

export async function download(_req, res) {
  const grades = sqlite.getGradesCsvFormat()
  const body = csv.stringify(grades, { header: true })

  const filename = `fyt-app-grades-${Date.now()}.csv`
  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(body)
}

export async function post(req, res) {
  const body = req.body

  const leaderGrades = []
  const crooGrades = []
  const freeResponse = req.body['free-response']

  for (let i = 0; i < 4; i++) {
    const leaderGrade = body[`leader-rubric-${i}`]
    const crooGrade = body[`croo-rubric-${i}`]
    if (leaderGrade) leaderGrades.push(leaderGrade)
    if (crooGrade) crooGrades.push(crooGrade)
  }

  if (!validateGrades(leaderGrades) || !validateGrades(crooGrades) || !freeResponse) {
    return res.sendStatus(400)
  }

  sqlite.submitGrade(req.user, freeResponse, leaderGrades, crooGrades)
  sqlite.deleteLock(req.user)
  const application = sqlite.getApplicationForUser(req.user)
  return applicationView.renderApplication(res, application)
}

function validateGrades(grades) {
  const gradesInRange = grades.every(grade => (grade > 0 && grade <= 4))
  const validLength = grades.length === 0 || grades.length === 4
  return gradesInRange && validLength
}
