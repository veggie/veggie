import chalk from 'chalk'
import { randomExclusive } from './common'

const { blue, green, red, underline, gray } = chalk

const log  = message => console.log(green(message))
const error = message => console.log(red(message))

const mock = type => blue(`${type}:`)
const colors = ['red','blue','green','yellow','magenta','cyan','white','gray']
const randomColor = message => chalk[colors[randomExlusive(colors.length)]](message)
const random = message => message.split(' ').map(word => randomColor(word)).join(' ')

const profile = mock('service-profile')
const server = mock('mock-server')
const client = mock('mock-client')

export const profileLog = message => log(`${profile} ${message}`)
export const serverLog = message => log(`${server} ${message}`)
export const clientLog = message => log(`${client} ${message}`)
export const profileError = message => error(`${profile} ${message}`)
export const serverError = message => error(`${server} ${message}`)
export const clientError = message => error(`${client} ${message}`)
export const prompt = message => gray(message)
export const wwwLog = message => console.log(underline(random(message)))

