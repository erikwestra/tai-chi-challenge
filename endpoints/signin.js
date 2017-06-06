/* endpoints/signin.js
 *
 * This module implements the "/signin" endpoint for our application.
 */

var db = require('../lib/db')
var session = require('../lib/session')
var chartcalc = require('../lib/chartcalc')

async function get(request, response) {
  var charts = await chartcalc.buildSummaryCharts()

  response.render('signin', {
    cur_username: "",
    error: null,
    charts: charts
  })
}

async function post(request, response) {
  var username = request.body.username
  var password = request.body.password

  var error = null // initially.

  if (!username) {
    error = "Please enter your username"
  } else if (!password) {
    error = "Please enter your password"
  }

  try {
    if (error == null) {
      var results = await db.query('SELECT id FROM users ' +
                                   'WHERE (username=$1) ' +
                                   'AND (password=$2)',
                                   username, password)
      if (results.rows.length == 0) {
        error = "Incorrect username or password"
      }
    }

    if (error == null) {
      session.signIn(results.rows[0].id, response)
      response.redirect(302, '/results')
      return
    }

    var charts = await chartcalc.buildSummaryCharts()

    response.render('signin', {
      cur_username: username,
      error: error,
      charts: charts
    })
  } catch (err) {
    console.error(err)
    response.status(500).send(JSON.stringify(err))
  }
}

module.exports = function(request, response) {
  if (session.isSignedIn(request)) {
    response.redirect(302, '/results')
  }

  if (request.method == "GET") {
    return get(request, response)
  } else if (request.method == "POST") {
    return post(request, response)
  } else {
    response.status(405) // Method not allowed.
  }        
}
