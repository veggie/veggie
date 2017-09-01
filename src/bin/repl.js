import meow from 'meow'
import net from 'net'
import { socketPath } from '../common'
import { clientError, clientLog } from '../log'

const cli = meow(`
      Usage
        $ mock-client

      Options
        -v, --version  Output mock-client version and exit

      Examples
        $ mock-client
        connected to repl at [PORT]
  `, {
    alias: {
      v: 'version'
    }
  })

const socket = net.createConnection(socketPath)

socket.setEncoding('utf8')
process.stdin.pipe(socket)
socket.pipe(process.stdout)

socket.on('connect', () => {
  clientLog(`connected to repl at ${socketPath}`)
  process.stdin.resume()
  process.stdin.setRawMode(true)
})

socket.on('message', data => {
  clientLog(`data received - ${data}\n`)
})

socket.on('error', e => {
  clientError(`repl error ${e}`)
})

socket.on('close', /* done */() => {
  clientLog('repl closing')
  process.stdin.setRawMode(false)
  process.stdin.pause()
  // socket.removeListener('close', done)
})

process.stdin.on('end', () => {
  socket.destroy()
})

process.stdin.on('data', (b) => {
  if (b.length === 1 && b[0] === 4) {
    process.stdin.emit('end')
  }
})
