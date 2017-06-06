/* endpoints/landing.js
 *
 * This module implements the top-level ('/') endpoint for our application.  We
 * simply redirect to "/results" or "/signin" depending on whether or not the
 * user is signed in.
 */

var session = require('../lib/session')

module.exports = function(request, response) {
    if (request.method != "GET") {
        response.status(405) // Method not allowed.
        return
    }

    if (session.isSignedIn(request)) {
        response.redirect(302, '/results')
    } else {
        response.redirect(302, '/signin')
    }
}
