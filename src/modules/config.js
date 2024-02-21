import dotenv from 'dotenv'
dotenv.config()

function safeParse (varName) {
  try {
    return JSON.parse(process.env[varName])
  } catch (error) {
    console.error(`Error parsing ${varName}. Are you sure it's in the environment?`)
    throw error
  }
}

const APP_CONFIG = safeParse('APP_CONFIG')
const FULL_SERVICE_KEY = safeParse('GOOGLE_SERVICE_KEY')
const BASE_64_GOOGLE_KEY = process.env.GOOGLE_SERVICE_PRIVATE_KEY_BASE_64

const private_key = Buffer.from(BASE_64_GOOGLE_KEY, 'base64').toString('ascii')

const GOOGLE_SERVICE_KEY = { ...FULL_SERVICE_KEY, private_key }
const REDIS_URL = process.env.REDIS_URL
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

export { GOOGLE_SERVICE_KEY, APP_CONFIG, REDIS_URL, GOOGLE_CLIENT_ID }
