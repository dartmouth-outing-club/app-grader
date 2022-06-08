// https://developers.google.com/identity/sign-in/web/backend-auth#using-a-google-api-client-library
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID } from './config.js'

const client = new OAuth2Client(GOOGLE_CLIENT_ID)

/**
 * Validate the provided JWT and extract the user's email from it.
 *
 * @param token JWT token provdided by the user
 * @returns the user's email if valid
 * @throws exception if the user is not valid
 */
async function verifyJwt(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  })
  const payload = ticket.getPayload()
  const userid = payload['email']
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return userid
}

export async function getUserFromJwt(event) {
  const headers = event?.request?.headers
  const authorization = headers.get('Authorization')

  try {
    return verifyJwt(authorization.replace('Bearer ', ''))
  } catch (err) {
    console.warn(`Invalid JWT provided by ${event.clientAddress}`)
    console.warn(err)
    throw 'ACCESS_DENIED'
  }
}
