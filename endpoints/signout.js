/* endpoints/signout.js
 *
 * This module implements the "/signout" endpoint.
 */

var session = require('../lib/session')

async function get(request, response) {
  if (session.isSignedIn(request)) {
    session.signOut(request, response)
  }
  response.redirect(302, '/signin')
}

module.exports = function(request, response) {
  if (request.method == "GET") {
    return get(request, response)
  } else {
    response.status(405) // Method not allowed.
  }        
}
