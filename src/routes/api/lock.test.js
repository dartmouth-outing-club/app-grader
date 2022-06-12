import test from 'node:test'
import assert from 'node:assert/strict'
import { mock, GOOGLE_CLIENT_AUTH, REDIS, throwsException } from '../../../test/mocker.js'

test('POST /api/lock', async (t) => {
  test('it responds with 403 for unverified user', async () => {
    const { post } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: throwsException }
    })
    const res = await post()
    assert.equal(res.status, 403)
  })

  test('it responds with 500 if getApplicationForUser throws an exception', async () => {
    const { post } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: { getApplicationForUser: throwsException }
    })
    const res = await post()
    assert.equal(res.status, 500)
  })

  test('it responds with 204 if getApplicationForUser returns empty applicationId', async () => {
    const { post } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: { getApplicationForUser: () => ({}) }
    })
    const res = await post()
    assert.equal(res.status, 204)
  })

  test('it responds with 200 and application fields on success', async () => {
    const application = {
      applicationId: 'f002c6t',
      fields: {
        'Why trips?': 'I want everyone to feel welcome'
      },
      secondsRemaining: 1000
    }
    const { post } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: { getApplicationForUser: () => application }
    })

    const res = await post()
    const { body, status } = res
    const resultingApplication = JSON.parse(body)

    assert.equal(status, 200)
    assert.equal(resultingApplication.secondsRemaining, 1000)
    assert.equal(resultingApplication.application['Why trips?'], 'I want everyone to feel welcome')
  })
})

test('DELETE /api/lock', async (t) => {
  test('throws 403 for unverified user', async () => {
    const { del } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: throwsException }
    })
    const res = await del()
    assert.equal(res.status, 403)
  })

  test('it responds with 500 on redis error', async () => {
    const { del } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: { deleteLock: throwsException }
    })

    const res = await del('testuser')
    assert.equal(res.status, 500)
  })

  test('it responds with 204 on a successful delete', async () => {
    const { del } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: { deleteLock: () => {} }
    })

    const res = await del('testuser')
    assert.equal(res.status, 204)
  })
})
