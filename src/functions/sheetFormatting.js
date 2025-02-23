import { APP_CONFIG } from '../modules/config.js'

/**
 * Create an array of { question, response } objects.
 *
 * In the database, responses the this year's questions are always stored in the same order.
 * When retrieve this responses from the database, we zip together the array of questions and
 * the array of responses into a more semantic { question, response } object.
 */
export function createFieldsFromResponses (responses) {
  return APP_CONFIG.questions.map((question, index) => {
    return { question, response: responses[index] }
  })
}
