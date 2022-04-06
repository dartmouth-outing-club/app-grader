import dotenv from 'dotenv'
dotenv.config()

const APP_CONFIG = JSON.parse(process.env.APP_CONFIG)
const GOOGLE_SERVICE_KEY = {
	...JSON.parse(process.env.GOOGLE_SERVICE_KEY),
	private_key: process.env.GOOGLE_SERVICE_PRIVATE_KEY
}
const REDIS_URL = process.env.REDIS_URL
export { GOOGLE_SERVICE_KEY, APP_CONFIG, REDIS_URL }
