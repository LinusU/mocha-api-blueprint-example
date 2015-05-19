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

  switch (head) {

    // USERS

    case 'POST /users':
      var user = extend(data, { id: randomId() })
      this.db.users.push(user)
      return user
    case 'GET /users':
      return this.allUsers()
    case 'GET /users/:id':
      var users = this.allUsers().filter(byField('id', id))
      if (users.length === 0) break
      return users[0]

    // SESSIONS

    case 'POST /sessions':
      var users = this.db.users.filter(byField('username', data.username))
      if (users.length === 0) break
      if (users[0].password !== data.password) return undefined
      var session = { id: randomId(), token: randomToken(), userId: users[0].id }
      this.db.sessions.push(session)
      return session
    case 'GET /sessions/:id':
      var sessions = this.db.sessions.filter(byField('id', id))
      if (sessions.length === 0) break
      return sessions[0]
    case 'DELETE /sessions/:id':
      var preSessionsLength = this.db.sessions.length
      this.db.sessions = this.db.sessions.filter(byFieldNot('id', id))
      if (preSessionsLength === this.db.sessions.length) break
      return undefined

    // MESSAGES

    case 'POST /messages':
      var message = extend(data, { id: randomId() })
      this.db.messages.push(message)
      return message
    case 'GET /messages':
      return this.db.messages
    case 'GET /messages/:id':
      var messages = this.db.messages.filter(byField('id', id))
      if (messages.length === 0) break
      return messages[0]
    case 'DELETE /messages/:id':
      var preMessagesLength = this.db.messages.length
      this.db.messages = this.db.messages.filter(byFieldNot('id', id))
      if (preMessagesLength === this.db.messages.length) break
      return undefined

  }

  throw new Error('Not found')
}

module.exports = Server
