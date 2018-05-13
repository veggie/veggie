const path = require('path')
const { parse } = require('url')

function sendJSON (res, obj, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json'
  })

  return res.end(JSON.stringify(obj))
}

module.exports = {
  '/path': path.join(__dirname, '../data/test.json'),
  '/obj': { msg: 'obj' },
  '/fn': (req, res) => sendJSON(res, { msg: 'fn' }),
  '/fn/params/:id': (req, res) => sendJSON(res, { msg: 'fn', type: 'no-question', params: req.params }),
  '/fn/query': (req, res) => sendJSON(res, { msg: 'fn', query: parse(req.url, true).query }),
  '/fn/body': (req, res) => sendJSON(res, { msg: 'fn', body: req.body }),
  '/fn/question?': (req, res) => sendJSON(res, { msg: 'fn', type: 'question' }),
  '/fn/question?search=true': (req, res) => sendJSON(res, { msg: 'fn', type: 'question-with-query', val: true }),
  '/fn/question?search=false': (req, res) => sendJSON(res, { msg: 'fn', type: 'question-with-query', val: false }),
  '/fn/question?search=false&format=json': (req, res) => sendJSON(res, { msg: 'fn', type: 'question-with-query', val: 'json' })
}
