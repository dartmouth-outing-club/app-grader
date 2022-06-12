import esmock from 'esmock'

export const GOOGLE_CLIENT_AUTH = '../src/modules/googleClientAuth.js'
export const GOOGLE_SERVICE = '../src/modules/googleServiceAcc.js'
export const SQLITE = '../src/modules/sqlite-accessor.js'

export const mock = async (route, mocks) => {
  return esmock(route, {}, mocks)
}

export const throwsException = () => {
  throw 'Expected exception'
}
