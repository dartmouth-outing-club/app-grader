import test from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

test('delete function', async (t) => {

  test('throws 403 for unverified user', async () => {
    const { del } = await esmock('../src/routes/api/lock.js', {}, {
      '../src/modules/googleClientAuth.js': { getUserFromJwt: () => {throw 'Error'}},
    })
    const res = await del();
    assert.equal(res.status, 403)
  })

  test('returns 500 on redis error', async () => {
    const { del } = await esmock('../src/routes/api/lock.js', {}, {
      '../src/modules/googleClientAuth.js': { getUserFromJwt: () => 'testuser'},
      '../src/modules/redis.js': { deleteLock: () => {throw 'Error'}},
    })
    const res = await del('testuser');
    assert.equal(res.status, 500)
  })

  test('returns 204 on a successful delete', async () => {
    const { del } = await esmock('../src/routes/api/lock.js', {}, {
      '../src/modules/googleClientAuth.js': { getUserFromJwt: () => 'testuser'},
      '../src/modules/redis.js': { deleteLock: () => {}},
    })
    const res = await del('testuser');
    assert.equal(res.status, 204)
  })

})
