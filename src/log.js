import chalk from 'chalk'
import { randomExclusive } from './common'

const { blue, green, red, underline, gray } = chalk

let logEnabled = true
export function setLog (enabled) {
  logEnabled = enabled
}

/* Log message if enabled */
function log (output) {
  if (logEnabled) {
    console.log(output)
  }
}

/* Log messages */
export const profileLog = message => log(chalk`{blue veggie:} {green ${message}}`)
export const serverLog = message => log(chalk`{blue veg:} {green ${message}}`)
export const clientLog = message => log(chalk`{blue veg-connect:} {green ${message}}`)

/* Error messages */
export const profileError = message => log(chalk`{blue veggie:} {red ${message}}`)
export const serverError = message => log(chalk`{blue veg:} {red ${message}}`)
export const clientError = message => log(chalk`{blue veg-connect:} {red ${message}}`)

/* Random color */
const colors = ['yellow','magenta','cyan','white']
const randomColor = message => chalk[colors[randomExclusive(colors.length)]](message)
const random = message => message.split(' ').map(word => randomColor(word)).join(' ')

export const wwwLog = message => log(underline(random(message)))
