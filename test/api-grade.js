import test from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

import { get } from '../src/routes/api/grade.js'

test('it gets the grader questions', async (t) => {
  const response = await get()
  const body = JSON.parse(response.body)
  assert.equal(response.status, 200)

  console.log(body.length)
  assert.equal(body.length, 5)
  assert.equal(body[0], 'Introspection on Identities and Perspectives')
})

test('post function', async (t) => {
  // Mock the client dependencies
  const { post } = await esmock(
    '../src/routes/api/grade.js',
    {},
    {
      '../src/modules/googleClientAuth.js': { getUserFromJwt: () => 'testuser' },
      '../src/modules/googleServiceAcc.js': { addGrade: () => {} },
      '../src/modules/redis.js': { submitGrade: () => 'test-app-id' }
    }
  )

  test('it posts a well-formatted grade attempt', async (t) => {
    const body = {
      freeResponse: 'This was a good application',
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    console.log(response)
    assert.equal(response.status, 200)
  })

  test('it returns 400 if the body is malformatted', async (t) => {
    const body = {
      freeResponse: {},
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    console.log(response)
    assert.equal(response.status, 400)
  })

  test('it returns 500 when submitting to redis throws an exception', async (t) => {
    const { post } = await esmock(
      '../src/routes/api/grade.js',
      {},
      {
        '../src/modules/googleClientAuth.js': { getUserFromJwt: () => 'testuser' },
        '../src/modules/googleServiceAcc.js': { addGrade: () => {} },
        '../src/modules/redis.js': {
          submitGrade: () => {
            throw 'Redis exception'
          }
        }
      }
    )

    const body = {
      freeResponse: 'This was a good application',
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    console.log(response)
    assert.equal(response.status, 500)
  })

  test('it returns 500 when submitting to google throws an exception', async (t) => {
    const { post } = await esmock(
      '../src/routes/api/grade.js',
      {},
      {
        '../src/modules/googleClientAuth.js': { getUserFromJwt: () => 'testuser' },
        '../src/modules/googleServiceAcc.js': {
          addGrade: () => {
            throw 'Google error'
          }
        },
        '../src/modules/redis.js': { submitGrade: () => 'test-app-id' }
      }
    )

    const body = {
      freeResponse: 'This was a good application',
      leaderRubric: [1, 1, 2, 2],
      crooRubric: [1, 1, 2, 2]
    }
    const event = { request: { json: () => body } }

    const response = await post(event)
    console.log(response)
    assert.equal(response.status, 500)
  })
})
