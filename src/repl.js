import fs from 'fs'
import net from 'net'
import path from 'path'
import repl from 'repl'
import { apiMethods } from './api'
import { clientLog, clientError, serverLog, serverError } from './log'
import { socketPath } from './common'
import pkg from '../package.json'

/**
 * @returns {string} - absolute path to file
 */
function getFilePath (name) {
  return path.join(process.cwd(), name)
}

/**
 * Create the repl server
 * @returns void
 */
export default function replServer () {
  // cleanup leftover socket if it exists
  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath)
  }

  // Open net connection for repl
  const replServer = net.createServer()
  
  replServer.on('connection', socket => {
    serverLog('repl client session connected')

    const session = repl.start({
      prompt: `veg v${pkg.version} $ `,
      input: socket,
      output: socket,
      terminal: true
    })

    session.defineCommand('save', {
      help: 'Save session to file',
      action (name) {
        const file = getFilePath(name)
        fs.writeFileSync(file, apiMethods.showAll())
        clientLog(`saved to ${file}`)
        this.displayPrompt()
      }
    })

    session.defineCommand('load', {
      help: 'Load session from file',
      action (name) {
        const file = getFilePath(name)
        const fileData = fs.readFileSync(file)
        try {
          const json = JSON.parse(fileData)
          apiMethods.load(json)
          clientLog(`profile loaded from ${file}`)
        } catch (e) {
          clientError(`error reading profile from ${file}`)
        }
      }
    })

    session.on('exit', () => {
      serverLog('repl client session exited')
      socket.end()
    })

    session.context = Object.assign(session.context, apiMethods)
  })

  replServer.on('listening', () => {
    serverLog(`repl listening at ${socketPath}`)
  })

  replServer.on('error', (e) => {
    serverError(`repl error - ${e}`)
    replServer.close()
  })

  replServer.on('close', () => {
    serverLog('repl closing')
  })

  replServer.listen(socketPath)
}
