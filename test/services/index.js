const path = require('path')

module.exports = {
  '/path': path.join(__dirname, '../data/sample.json'),
  '/obj': { msg: 'obj' },
  '/fn': (req, res) => res.send({ msg: 'fn' }),
  '/fn/params/:id': (req, res) => res.send({ msg: 'fn', params: req.params }),
  '/fn/query': (req, res) => res.send({ msg: 'fn', query: req.query }),
  '/fn/body': (req, res) => res.send({ msg: 'fn', body: req.body })
}
