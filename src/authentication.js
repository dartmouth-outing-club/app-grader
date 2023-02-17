// https://developers.google.com/identity/sign-in/web/backend-auth#using-a-google-api-client-library
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID } from './modules/config.js'

const client = new OAuth2Client(GOOGLE_CLIENT_ID)

export async function getUser (req, res, next) {
  const jwt = getGoogleAuthCookie(req)
  req.user = await getUserFromJwt(jwt)
  return next()
}

export async function requireUser (req, res, next) {
  const jwt = getGoogleAuthCookie(req)
  req.user = await getUserFromJwt(jwt)
  if (!req.user) return res.sendStatus(401)
  return next()
}


function getGoogleAuthCookie (req) {
  const cookies = req.get('cookie')?.split('; ')
  const authCookie = cookies?.find(item => item.includes('google_auth'))?.split('=') || []
  return authCookie.at(1)
}

/**
 * Validate the provided JWT and extract the user's email from it.
 *
 * @param token JWT token provdided by the user
 * @returns the user's email if valid
 * @throws exception if the user is not valid
 */
async function getUserFromJwt (token) {
  if (typeof token !== 'string') return undefined

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    })
    const payload = ticket.getPayload()
    const userid = payload.email
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
   return userid
  } catch (err) {
    console.warn(`Invalid JWT ${token}`)
    console.warn(err)
    return undefined
  }
}

