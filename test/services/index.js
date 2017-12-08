const path = require('path')

module.exports = {
  '/path': path.join(__dirname, '../data/test.json'),
  '/obj': { msg: 'obj' },
  '/fn': (req, res) => res.send({ msg: 'fn' }),
  '/fn/params/:id': (req, res) => res.send({ msg: 'fn', type: 'no-question', params: req.params }),
  '/fn/params/:id?': (req, res) => res.send({ msg: 'fn', type: 'question', params: req.params }),
  '/fn/params/:id?search=true': (req, res) => res.send({ msg: 'fn', type: 'question-with-query', params: req.params }),
  '/fn/query': (req, res) => res.send({ msg: 'fn', query: req.query }),
  '/fn/body': (req, res) => res.send({ msg: 'fn', body: req.body })
}
