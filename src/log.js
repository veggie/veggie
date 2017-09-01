import chalk from 'chalk'
import { randomExclusive } from './common'

const { blue, green, red, yellow, magenta, cyan, white, underline, gray } = chalk

const log  = message => console.log(green(message))
const error = message => console.log(red(message))

const mock = type => blue(`mock-${type}:`)
const colors = [ red, blue, green, yellow, magenta, cyan, white, gray ]
const randomColor = message => colors[randomExlusive(colors.length)](message)
const random = message => message.split(' ').map(word => randomColor(word)).join(' ')

const server = mock('server')
const client = mock('client')

export const serverLog = message => log(`${server} ${message}`)
export const clientLog = message => log(`${client} ${message}`)
export const serverError = message => error(`${server} ${message}`)
export const clientError = message => error(`${client} ${message}`)
export const prompt = message => gray(message)
export const wwwLog = message => console.log(underline(random(message)))

