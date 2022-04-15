import { APP_CONFIG } from './config.js'

const GRADERS = APP_CONFIG.graders || []
console.log(`Loaded graders: ${GRADERS}`)

export { GRADERS }
