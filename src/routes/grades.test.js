import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mock,
  GOOGLE_CLIENT_AUTH,
  SQLITE,
  GOOGLE_SERVICE,
  throwsException
} from '../../../test/mocker.js'

import { get } from './grade.js'

test('GET /api/grade', async() => {
  test('it gets the grader questions', async(t) => {
    const response = await get()
    const body = JSON.parse(response.body)
    assert.equal(response.status, 200)

    assert.equal(body.length, 5)
    assert.equal(body[0], 'Introspection on Identities and Perspectives')
    assert.equal(body[1], 'Reflection and Critical Thought')
    assert.equal(body[2], 'Mentorship, Group Dynamics')
    assert.equal(body[3], 'Leadership, Teamwork')
    assert.equal(
      body[4],
      'Please record your overall thoughts and summary of this application, including comments on any relevant experiences or anecdotes. If applicable, please note if/how the applicant is better qualified to be a Trip Leader or Crooling. Write at least 350 characters in your summary.'
    )
  })
})

test('POST /api/grade', async(t) => {
  const { post } = await mock('../src/routes/api/grade.js', {
    [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
    [GOOGLE_SERVICE]: { addGrade: () => {} },
    [SQLITE]: { submitGrade: () => 'test-app-id' }
  })

  test('it posts a well-formatted grade attempt', async(t) => {
    const body = {
      freeResponse: 'This was a good application',
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    assert.equal(response.status, 200)
  })

  test('it responds with 400 if the body is malformatted', async(t) => {
    const body = {
      freeResponse: {},
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    assert.equal(response.status, 400)
  })

  test('it responds with 500 when submitting to redis throws an exception', async(t) => {
    const { post } = await mock('../src/routes/api/grade.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [GOOGLE_SERVICE]: { addGrade: () => {} },
      [SQLITE]: { submitGrade: throwsException }
    })

    const body = {
      freeResponse: 'This was a good application',
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    assert.equal(response.status, 500)
  })

  test('it responds with 500 when submitting to google throws an exception', async(t) => {
    const { post } = await mock('../src/routes/api/grade.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [GOOGLE_SERVICE]: { addGrade: throwsException },
      [SQLITE]: { submitGrade: () => {} }
    })

    const body = {
      freeResponse: 'This was a good application',
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    assert.equal(response.status, 500)
  })
})
