/**
 * generate-env-vars.js - turn the config files into environment variables
 *
 * Note that all paths are relative to the source root, so the script should
 * be run from there i.e. `node scripts/generate-env-vars.js`
 */
import fs from 'fs'
import { exit } from 'process'

const SERVICE_KEY_FP = './config/jwt.keys.json'
const APP_CONFIG_FP = './config/app-config.json'
const CLIENT_OAUTH_FP = './config/client-oauth.json'

const serviceKey = JSON.parse(fs.readFileSync(SERVICE_KEY_FP).toString())
const appConfig = JSON.parse(fs.readFileSync(APP_CONFIG_FP).toString())
const clientKey = JSON.parse(fs.readFileSync(CLIENT_OAUTH_FP).toString())

const { private_key, ...restOfServiceKey } = serviceKey
const frontendClientId = clientKey.web.client_id

// The VITE prefix exposes the variable to frontend
const envFile = `GOOGLE_SERVICE_KEY=${JSON.stringify(restOfServiceKey)}
GOOGLE_SERVICE_PRIVATE_KEY="${private_key}"
VITE_GOOGLE_CLIENT_ID=${frontendClientId}
APP_CONFIG=${JSON.stringify(appConfig)}`

// Write the file
fs.writeFileSync('./.env', envFile, { flag: 'w+' })
exit(0)
