import { isCrooApp, isLeaderApp } from './functions/trips.js'

const INTROSPECTION = 'Introspection on Identities and Perspectives'
const REFLECTION = 'Reflection and Critical Thought'
const MENTORSHIP = 'Mentorship, Group Dynamics'
const LEADERSHIP = 'Leadership, Teamwork'
const questions = [INTROSPECTION, REFLECTION, MENTORSHIP, LEADERSHIP]

export function renderApplication(res, application) {
  // If it came back empty, that means there's no applications
  const { applicationId, fields, secondsRemaining } = application
  if (!applicationId) return res.send('<div>Nothing to grade right now!</div>')

  const leader_app = isLeaderApp(fields)
  const croo_app = isCrooApp(fields)
  const timeRemaining = getTimeRemaining(secondsRemaining)

  res.render('application.njk', { fields, timeRemaining, questions, leader_app, croo_app })
}

export function renderSecondsSpan (res, secondsRemaining) {
  const timeRemaining = getTimeRemaining(secondsRemaining)
  res.render('seconds-span.njk', { timeRemaining })
}

function getTimeRemaining (seconds) {
  const text = seconds > 60 ? `${Math.floor(seconds / 60)} minutes` : `${seconds} seconds`
  return { text, seconds }
}
