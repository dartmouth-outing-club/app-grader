import test from 'node:test'
import assert from 'node:assert/strict'
import { mock, GOOGLE_CLIENT_AUTH, REDIS } from './mocker.js'

test('DELETE request', async (t) => {
  test('throws 403 for unverified user', async () => {
    const { del } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: {
        getUserFromJwt: () => {
          throw 'Error'
        }
      }
    })

    const res = await del()
    assert.equal(res.status, 403)
  })

  test('returns 500 on redis error', async () => {
    const { del } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: {
        deleteLock: () => {
          throw 'Error'
        }
      }
    })

    const res = await del('testuser')
    assert.equal(res.status, 500)
  })

  test('returns 204 on a successful delete', async () => {
    const { del } = await mock('../src/routes/api/lock.js', {
      [GOOGLE_CLIENT_AUTH]: { getUserFromJwt: () => 'testuser' },
      [REDIS]: { deleteLock: () => {} }
    })

    const res = await del('testuser')
    assert.equal(res.status, 204)
  })
})
