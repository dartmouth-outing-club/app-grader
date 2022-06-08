import {
  ACCESS_DENIED_RES,
  ERROR_RES,
  INVALID_REQUEST,
  SUCCESS_RES
} from '../../constants/httpConstants.js'
import { getUserFromJwt } from '../../modules/googleClientAuth.js'
import { addGrade } from '../../modules/googleServiceAcc.js'
import { submitGrade } from '../../modules/redis.js'

const INTROSPECTION = 'Introspection on Identities and Perspectives'
const REFLECTION = 'Reflection and Critical Thought'
const MENTORSHIP = 'Mentorship, Group Dynamics'
const LEADERSHIP = 'Leadership, Teamwork'
const TEXT_QUESTION =
  'Please record your overall thoughts and summary of this application, including comments on any relevant experiences or anecdotes. If applicable, please note if/how the applicant is better qualified to be a Trip Leader or Crooling. Write at least 350 characters in your summary.'

/** Get the questions for the grading form */
export async function get() {
  const questions = [INTROSPECTION, REFLECTION, MENTORSHIP, LEADERSHIP, TEXT_QUESTION]
  return {
    status: 200,
    body: JSON.stringify(questions),
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

export async function post(event) {
  // Verify user's JWT
  let userId
  try {
    userId = await getUserFromJwt(event)
  } catch {
    return ACCESS_DENIED_RES
  }

  const body = await event.request.json()
  const { freeResponse, leaderRubric, crooRubric } = body
  if (
    typeof freeResponse !== 'string' ||
    typeof leaderRubric !== 'object' ||
    typeof crooRubric !== 'object'
  ) {
    return INVALID_REQUEST
  }

  try {
    const applicationId = await submitGrade(userId, body)
    addGrade(userId, applicationId, freeResponse, leaderRubric, crooRubric)
    return SUCCESS_RES
  } catch (error) {
    console.log(error)
  }

  return ERROR_RES
}
