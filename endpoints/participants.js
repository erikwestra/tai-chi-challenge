/* endpoints/participants.js
 *
 * This module implements the "/participants" endpoint for our application.
 */

var session = require('../lib/session')
var db = require('../lib/db')

module.exports = async function (request, response) {
  if (request.method != "GET") {
    response.status(405) // Method not allowed.
    return
  }

  if (!session.isSignedIn(request)) {
    response.redirect(302, '/')
    return
  }

  var user_id = session.getUserId(request)
  var name = await session.getUserName(request)
  var branch = await session.getUserBranch(request)

  var participants = [] // List of objects with 'id' and 'name' properties.

  var results = await db.query('SELECT id,name FROM participants ' +
                               'WHERE user_id=$1 ' +
                               'ORDER BY name', user_id)
  for (var i=0; i < results.rows.length; i++) {
    var row = results.rows[i]
    participants.push({id: row.id,
                       name: row.name})
  }

  response.render('participants', {
    name: name,
    curView: 'participants',
    participants: participants,
    branch: branch.name
  })
}
