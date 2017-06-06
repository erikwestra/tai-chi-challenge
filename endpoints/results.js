/* endpoints/results.js
 *
 * This module implements the "/results" endpoint for our application.
 */

var session = require('../lib/session')
var chartcalc = require('../lib/chartcalc')

async function get (request, response) {
  var userId = session.getUserId(request)
  var name = await session.getUserName(request)

  var charts = await chartcalc.buildChartsForUser(userId)

  response.render('results', {
    name: name,
    curView: 'results',
    charts: charts
  })
}

module.exports = function(request, response) {
  if (!session.isSignedIn(request)) {
    response.redirect(302, '/')
    return
  }

  if (request.method == "GET") {
    return get(request, response)
  } else {
    response.status(405) // Method not allowed.
  }
}
