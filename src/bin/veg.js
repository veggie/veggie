import meow from 'meow'
import { server } from '../index'
import { wwwLog } from '../log'

const cli = meow(`
      Usage
        $ veg -d <dir> -p <port> -t <time>

      Options
        -d, --dir       Glob matching files containing mock services
        -p, --port      Port to serve mocks from
        -t, --time      Max delay (in milliseconds) to wait before returning service response
        -v, --version   Output veg version and exit

      Examples
        $ veg -g services/**/index.js -p 9999 -d 1000
        Serving mock data from localhost:9999
  `, {
    string: 'dir',
    number: [ 'port', 'time' ],
    default: {
      port: 1337,
      maxDelay: 1000
    },
    alias: {
      d: 'dir',
      p: 'port',
      t: 'time',
      v: 'version'
    }
  })

const { port } = cli.flags
server(cli.flags).listen(port, () => {
  wwwLog(`Serving mock data from localhost:${port}`)
})
