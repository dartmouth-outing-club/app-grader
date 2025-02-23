import fs from 'node:fs'

const file = fs.readFileSync('./config.json')
const APP_CONFIG = JSON.parse(file)

export { APP_CONFIG }
