import fs from 'fs'
import net from 'net'
import repl from 'repl'
import { addr, methods } from './replUtils'

/**
 * @returns void
 */
export default function replServer () {
  // Open net connection for repl
  const replServer = net.createServer(socket => {
    console.log('Mocket session: Connected')
    const session = repl.start({
      prompt: 'mock-client > ',
      input: socket,
      output: socket,
      terminal: true
    })
    session.defineCommand('save', {
      help: 'Save session to file',
      action (name) {
        const history = this.history.reverse().filter(line => !(/^\./).test(line))
        const requires = `const { ${Object.keys(methods).join(', ')} } ` +
          `= require('service-profile/services/replUtils').methods`
        const file = `${process.cwd()}/${name}`
        fs.writeFileSync(file, [ requires, ...history ].join('\n'))
        console.log(`Saved to ${file}`)
        this.displayPrompt()
      }
    })
    session.defineCommand('load', {
      help: 'Load session from file',
      action (fileName) {
        const file = fs.readFileSync(fileName).toString()
        const code = file.replace('service-profile/services', '.')
        console.log('Running loaded code:\n', code, '\n--End of code--\n')
        eval(code)
      }
    })
    session.on('exit', () => {
      console.log('Mocket session: Exit')
      // socket.destroy()
      socket.end()
    })
    session.context = Object.assign(session.context, methods)
  })
  replServer.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Repl server: Address in use')
      replServer.close()
    }
  })
  replServer.on('close', () => {
    console.log('Repl server: Closing')
  })
  replServer.listen(addr)
}

