const bodyParser = require('body-parser')
const fs = require('fs')
const net = require('net')
const repl = require('repl')
const replUtils = require('./replUtils')

const servicesMap = fs.readdirSync(__dirname)
  .filter(name => /^[^\.]*$/.test(name)) // Directories -- files that don't contain '.'
  .reduce((acc, name) => {
    const services = require(`${__dirname}/${name}/index.js`)
    acc = Object.assign(acc, services)
    return acc
  }, {})

// Export function that takes the express app
function mockRoutes (app) {
  app.use(bodyParser.json())

  Object.keys(servicesMap).forEach(url => {
    let delay = Math.floor(Math.random() * 1000)
    let handler

    if (typeof servicesMap[url] === 'function') {
      handler = servicesMap[url]
    }
    else {
      handler = (req, res) => {
        const response = servicesMap[url]

        if (response) {
          res.json(response)
        }
        else {
          res.status(404).json({})
        }
      }
    }

    // Add the route to the app
    app.all(url, (...args) => {
      setTimeout(() => {
        handler(...args)
      }, delay)
    })
  })
}

function startRepl () {
  // Open net connection for repl
  const replServer = net.createServer(socket => {
    console.log('Mocket session: Connected')
    const session = repl.start({
      prompt: 'mock-socket (aka mocket)> ',
      input: socket,
      output: socket,
      terminal: true
    })
    session.defineCommand('save', {
      help: 'Save session to file',
      action (name) {
        const history = this.history.reverse().filter(line => !(/^\./).test(line))
        const requires = `const { ${Object.keys(replUtils.methods).join(', ')} } ` +
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
    session.context = Object.assign(session.context, replUtils.methods)
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
  replServer.listen(replUtils.addr)
}

module.exports = function (app) {
  const interactive = true

  if (interactive) {
    app.use(replUtils.blockMiddleware)
    startRepl()
  }
  mockRoutes(app)
}
