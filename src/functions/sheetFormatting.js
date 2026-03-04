import { APP_CONFIG } from '../modules/config.js'

/**
 * Create an array of { question, response } objects.
 *
 * In the database, responses the this year's questions are always stored in the same order.
 * When retrieve this responses from the database, we zip together the array of questions and
 * the array of responses into a more semantic { question, response } object.
 */
export function createFieldsFromResponses(responses) {
  return APP_CONFIG.questions.map((question, index) => {
    return { question: question.text, response: responses[index] }
  })
}

// https://stackoverflow.com/questions/21229180/convert-column-index-into-corresponding-column-letter/21231012#21231012
export function columnLetterToArrayIndex(letter) {
  var column = 0,
    length = letter.length
  for (var i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1)
  }
  return column - 1
}
