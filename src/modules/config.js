import dotenv from 'dotenv'
dotenv.config()

function safeParse(varName) {
	try {
		return JSON.parse(process.env[varName])
	} catch (error) {
		console.error(`Error parsing ${varName}`)
		throw error
	}
}

const APP_CONFIG = safeParse('APP_CONFIG')
const FULL_SERVICE_KEY = safeParse('GOOGLE_SERVICE_KEY')

const GOOGLE_SERVICE_KEY = {
	...FULL_SERVICE_KEY,
	private_key: process.env.GOOGLE_SERVICE_PRIVATE_KEY
}
const REDIS_URL = process.env.REDIS_URL
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID

export { GOOGLE_SERVICE_KEY, APP_CONFIG, REDIS_URL, GOOGLE_CLIENT_ID }
