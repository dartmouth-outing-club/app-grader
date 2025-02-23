import * as crypto from 'node:crypto'
import * as sqlite from '../src/modules/sqlite-accessor.js'

const COOKIE_SETTINGS = { maxAge: 2.592e9, httpOnly: true, secure: true }

export async function getUser (req, _res, next) {
  const user = getUserFromToken(req)
  req.user = user
  next()
}

export async function requireUser (req, res, next) {
  req.user = getUserFromToken(req)
  if (!req.user) {
    res.set('HX-Refresh', 'true') // Refresh the page to give the user a change to login again
    return res.sendStatus(401)
  }
  return next()
}

export async function logoutUser(req, res) {
  const token = getToken(req)
  sqlite.deleteUserSession(token)
  res.redirect('/')
}

export async function loginUser(req, res) {
  const id = req.body.netid
  const token = await getRandomKey()
  sqlite.createUserSession(id, token)
  res.cookie("token", token, COOKIE_SETTINGS)

  // TODO check password

  res.redirect('/')
}

function getToken(req) {
  const cookies = req.get('cookie')?.split('; ')
  const authCookie = cookies?.find(item => item.includes('token'))?.split('=') || []
  return authCookie[1]
}

function getUserFromToken(req) {
  const token = getToken(req)
  return sqlite.getUserForToken(token)
}

async function getRandomKey() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(128, (err, buf) => {
      if (err) reject(err)
      resolve(buf.toString('hex'))
    })
  })
}

