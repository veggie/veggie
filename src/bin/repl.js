import meow from 'meow'
import net from 'net'
import { addr } from '../profile'

const cli = meow(`
      Usage
        $ mock-client

      Options
        -v, --version  Output mock-client version and exit

      Examples
        $ mock-client
        connected to repl at ${addr}
  `, {
    alias: {
      v: 'version'
    }
  })

const sock = net.connect(addr)

sock.setEncoding('utf8')
process.stdin.pipe(sock)
sock.pipe(process.stdout)

sock.on('connect', function () {
  console.log(`connected to repl at ${addr}`)
  process.stdin.resume()
  process.stdin.setRawMode(true)
})

sock.on('message', function (data) {
  console.log(data.length, data)
})

sock.on('close', function done () {
  process.stdin.setRawMode(false)
  process.stdin.pause()
  sock.removeListener('close', done)
})

process.stdin.on('end', function () {
  sock.destroy()
  console.log()
})

process.stdin.on('data', function (b) {
  if (b.length === 1 && b[0] === 4) {
    process.stdin.emit('end')
  }
})
