var fs = require('fs')
var protagonist = require('protagonist')
var mochaApiBlueprint = require('mocha-api-blueprint')
var Server = require('../lib/server')

function testBlueprint (title, fileName) {
  describe(title, function () {
    var server = new Server()
    var source = fs.readFileSync(fileName, 'utf8')
    var parsed = protagonist.parseSync(source)

    var suite = new mochaApiBlueprint.Suite()

    suite.registerTransactions(parsed.ast, function (transaction, done) {
      var res = server.handle(transaction.req)

      if (transaction.res.body) {
        suite.validateResponse(res, JSON.parse(transaction.res.body))
      }

      done()
    })

  })
}

testBlueprint('API - Spec', 'Spec.apib')
testBlueprint('API - Usage', 'Usage.apib')
