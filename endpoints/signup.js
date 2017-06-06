/* controllers/signup.js
 *
 * This module implements the "/signup" endpoint.
 */

var db = require('../lib/db')
var session = require('../lib/session')

async function get(request, response) {
  if (session.isSignedIn(request)) {
    response.redirect(302, '/results')
  } else {
    var branches = await db.get_branches()
    response.render('signup',
      {cur_name      : "",
        cur_branch_id : null,
        cur_username  : "",
        branches      : branches,
        error         : null})
  }
}

async function post(request, response) {
  if (session.isSignedIn(request)) {
    response.redirect(302, '/results')
  } else {
    if (request.body.submit == "cancel") {
      response.redirect(302, '/signin')
      return
    }

    var cur_name      = request.body.name
    var cur_branch_id = request.body.branch_id
    var cur_username  = request.body.username
    var password1     = request.body.password1
    var password2     = request.body.password2

    var error = null // initially.

    if (!cur_name) {
      error = "You must enter your name"
    } else if (!cur_branch_id) {
      error = "You must select a branch"
    } else if (!cur_username) {
      error = "You must enter a username"
    } else if (!password1) {
      error = "You must enter a password"
    } else if (password1 != password2) {
      error = "The entered passwords do not match"
    }

    try {
      var results = await db.query('SELECT id FROM users ' +
        'WHERE username=$1', cur_username)

      if (results.rows.length > 0) {
        error = "Sorry, that username is already taken."
      }

      if (error == null) {
        results = await db.query(
          'INSERT INTO users (name, branch_id, username, ' +
          'password) VALUES ($1, $2, $3, $4) RETURNING id',
          cur_name, cur_branch_id, cur_username, password1)

        var user_id = results.rows[0].id

        results = await db.query(
          'INSERT INTO participants (user_id, name) VALUES ($1, $2)',
          user_id, cur_name)

        session.signIn(user_id, response)
        response.redirect(302, '/results')
        return
      }

      var branches = await db.get_branches()

      response.render('signup', {
        cur_name,
        cur_username,
        branches,
        cur_branch_id,
        error})
    } catch (err) {
      console.error(err)
      response.status(500).send(JSON.stringify(err))
    }
  }
}

module.exports = function(request, response) {
  if (request.method == "GET") {
    return get(request, response)
  } else if (request.method == "POST") {
    return post(request, response)
  } else {
    response.status(405) // Method not allowed.
  }        
}
