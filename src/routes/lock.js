import * as sqlite from '../modules/sqlite-accessor.js'
import * as applicationView from '../application.js'

export function get (req, res) {
  const application = sqlite.getApplicationForUser(req.user)
  applicationView.renderSecondsSpan(res, application)
}

export function post (req, res) {
  const application = sqlite.getApplicationForUser(req.user)
  applicationView.renderApplication(res, application)
}

export function del (req, res) {
  console.log(`Deleting lock for ${req.user}`)
  sqlite.deleteLock(req.user)
  return post(req, res)
}
