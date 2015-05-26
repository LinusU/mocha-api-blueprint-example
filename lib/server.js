var extend = require('xtend')
var crypto = require('crypto')

function randomId () {
  return Math.ceil(Math.random() * 99999)
}

function randomToken () {
  return crypto.pseudoRandomBytes(12).toString('hex')
}

function byField (key, val) {
  return function (item) { return (item[key] === val) }
}

function byFieldNot (key, val) {
  return function (item) { return (item[key] !== val) }
}

function Server () {
  this.db = {
    users: [],
    sessions: [],
    messages: []
  }
}

Server.prototype.allUsers = function () {
  return this.db.users.map(function (user) {
    return { id: user.id, username: user.username }
  })
}

Server.prototype.handle = function (req) {
  var parts = req.path.substring(1).split('/')
  var method = req.method
  var head = method + ' /' + parts[0] + (parts[1] ? '/:id' : '')
  var data = (req.body && JSON.parse(req.body))
  var id = (parts[1] && Number(parts[1]))

  function json (status, data) {
    var d = JSON.stringify(data)
    var h = { 'content-type': 'application/json', 'content-length': d.length }
    return { statusCode: status, headers: h, body: d }
  }
  function empty () {
    return { statusCode: 204, headers: {} }
  }
  function unauthorized () {
    return { statusCode: 403, headers: {} }
  }

  switch (head) {

    // USERS

    case 'POST /users':
      var user = extend(data, { id: randomId() })
      this.db.users.push(user)
      return json(201, user)
    case 'GET /users':
      return json(200, this.allUsers())
    case 'GET /users/:id':
      var users = this.allUsers().filter(byField('id', id))
      if (users.length === 0) break
      return json(200, users[0])

    // SESSIONS

    case 'POST /sessions':
      var users = this.db.users.filter(byField('username', data.username))
      if (users.length === 0) break
      if (users[0].password !== data.password) return unauthorized()
      var session = { id: randomId(), token: randomToken(), userId: users[0].id }
      this.db.sessions.push(session)
      return json(201, session)
    case 'GET /sessions/:id':
      var sessions = this.db.sessions.filter(byField('id', id))
      if (sessions.length === 0) break
      return json(200, sessions[0])
    case 'DELETE /sessions/:id':
      var preSessionsLength = this.db.sessions.length
      this.db.sessions = this.db.sessions.filter(byFieldNot('id', id))
      if (preSessionsLength === this.db.sessions.length) break
      return empty()

    // MESSAGES

    case 'POST /messages':
      var message = extend(data, { id: randomId() })
      this.db.messages.push(message)
      return json(201, message)
    case 'GET /messages':
      return json(200, this.db.messages)
    case 'GET /messages/:id':
      var messages = this.db.messages.filter(byField('id', id))
      if (messages.length === 0) break
      return json(200, messages[0])
    case 'DELETE /messages/:id':
      var preMessagesLength = this.db.messages.length
      this.db.messages = this.db.messages.filter(byFieldNot('id', id))
      if (preMessagesLength === this.db.messages.length) break
      return empty()

  }

  return { statusCode: 404, headers: {} }
}

module.exports = Server
