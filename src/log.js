import chalk from 'chalk'
import { randomExclusive } from './common'

const { blue, green, red, underline, gray } = chalk

let logEnabled = true

const out = (output) => {
  if (logEnabled) {
    console.log(output)
  }
}

export function setLog (enabled) {
  logEnabled = enabled
}

const log  = message => out(green(message))
const error = message => out(red(message))

const mock = type => blue(`${type}:`)
const colors = ['red','blue','green','yellow','magenta','cyan','white','gray']
const randomColor = message => chalk[colors[randomExclusive(colors.length)]](message)
const random = message => message.split(' ').map(word => randomColor(word)).join(' ')

const profile = mock('veggie')
const server = mock('veg')
const client = mock('veg-connect')

export const profileLog = message => log(`${profile} ${message}`)
export const serverLog = message => log(`${server} ${message}`)
export const clientLog = message => log(`${client} ${message}`)
export const profileError = message => error(`${profile} ${message}`)
export const serverError = message => error(`${server} ${message}`)
export const clientError = message => error(`${client} ${message}`)
export const wwwLog = message => out(underline(random(message)))
