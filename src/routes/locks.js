import * as sqlite from '../modules/sqlite-accessor.js'
import * as applicationView from '../application.js'

export function get(req, res) {
  const secondsRemaining = sqlite.getSecondsRemainingForLock(req.user)
  if (!secondsRemaining || secondsRemaining < 1) {
    res.set('HX-Refresh', 'true') // Refresh the page to close the application if time has expired
    return res.sendStatus(200)
  }
  applicationView.renderSecondsSpan(res, secondsRemaining)
}

export function post(req, res) {
  const application = sqlite.getApplicationForUser(req.user)
  applicationView.renderApplication(res, application)
}

export function del(req, res) {
  console.log(`Deleting lock for ${req.user}`)
  sqlite.deleteLock(req.user)
  return post(req, res)
}
