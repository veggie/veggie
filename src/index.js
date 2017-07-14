const bodyParser = require('body-parser')
const fs = require('fs')
const glob = require('glob')
const net = require('net')
const path = require('path')
const repl = require('repl')
const replUtils = require('./replUtils')

// TODO:
// support other HTTP methods

let MAX_DELAY = 1000

// Export function that takes the express app
function addRoutes (app, routes) {
  app.use(bodyParser.json())

  Object.keys(routes).forEach(url => {
    let delay = Math.floor(Math.random() * MAX_DELAY)
    let handler

    if (typeof routes[url] === 'function') {
      // express route
      handler = routes[url]
    } else {
      let response

      if (typeof routes[url] === 'string') {
        // path to json file
        response = require(routes[url])
      } else {
        // json object
        response = routes[url]
      }

      handler = (req, res) => {
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
      prompt: 'mock-client > ',
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

function serveFromGlob ({ app, glob: pattern, delay }) {
  if (delay) {
    MAX_DELAY = delay
  }
  glob(pattern, (err, files) => {
    console.log(files)
    routes = files
      .reduce((acc, file) => {
        const services = require(file)
        acc = Object.assign(acc, services)
        return acc
      }, {})
    mockRoutes(app, routes)
  })
}

function mockRoutes (app, routes) {
  app.use(replUtils.profileMiddleware)
  startRepl()
  addRoutes(app, routes)
}

module.exports = { serveFromGlob, mockRoutes }
