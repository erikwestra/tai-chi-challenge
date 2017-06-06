/* endpoints/Participant.js
 *
 * This module implements the '/participant/:id' endpoint for our application.
 */

var session = require('../lib/session')
var db = require('../lib/db')

// ==========================================================================

async function get (request, response) {
  var participantId = request.params.id

  // If we're adding a new participant, show the 'add participant' view.

  if (participantId == 'add') {
    response.render('participant', {
      url: '/participant/add',
      header: 'Add Participant',
      name: '',
      error: null,
      canDelete: false
    })
    return
  }

  // Get the details of the participant we want to edit.

  var results = await db.query('SELECT name FROM participants WHERE id=$1',
                               participantId)

  if (results.rows.length != 1) {
    console.log('Invalid participant ID:', participantId)
    response.redirect(302, '/participants')
    return
  }

  var name = results.rows[0].name
  var curUsersName = await session.getUserName(request)
  var canDelete = (name !== curUsersName)

  // Show the 'edit participant' view.

  response.render('participant', {
    url: '/participant/' + participantId,
    header: 'Edit Participant',
    name: name,
    error: null,
    canDelete: canDelete
  })
}

// ==========================================================================

async function post (request, response) {
  var participantId = request.params.id

  if (request.body.submit === 'Cancel') {
    response.redirect(302, '/participants')
    return
  }

  // If the user clicked on the 'delete' button, delete this participant.

  if (request.body.submit === 'Delete') {
    await db.query('DELETE FROM participants WHERE id=$1', participantId)
    response.redirect(302, '/participants')
    return
  }

  // Get the details we need, including the old and new participant names.

  var userId = await session.getUserId(request)
  var userName = await session.getUserName(request)
  var newName = request.body.name
  var error = null // initially.

  var oldName
  if (participantId !== 'add') {
    var results = await db.query('SELECT name FROM participants WHERE id=$1',
                                 participantId)

    if (results.rows.length != 1) {
      console.log('Invalid participant ID:', participantId)
      response.redirect(302, '/participants')
      return
    }

    oldName = results.rows[0].name
  }

  // Check that the new name is acceptable.

  if (!newName) {
    error = 'You must enter a name'
  }

  if (!error) {
    var results = await db.query('SELECT id FROM participants WHERE name=$1',
                                 newName)
    if (results.rows.length > 0) {
      if ((participantId !== 'add') && (results.rows[0].id != participantId)) {
        error = 'Sorry, that name is used by another participant'
      }
    }
  }

  // If there's a problem, re-display the add/edit participant view with the
  // error message.

  if (error) {
    var header
    if (participantId === 'add') {
      header = 'Add Participant'
    } else {
      header = 'Edit Participant'
    }

    var canDelete = true
    if (participantId === 'add') {
      canDelete = false
    } else if (oldName === userName) {
      canDelete = false // Can't delete yourself.
    }

    response.render('participant', {
      url: "/participant/" + participantId,
      header: header,
      name: newName,
      error: error,
      canDelete: canDelete
    })

    return
  }

  // If we're adding a new participant, do so.

  if (participantId === 'add') {
    await db.query('INSERT INTO participants (user_id, name) VALUES ($1, $2)',
                   userId, newName)
    response.redirect(302, '/participants')
    return
  }

  // If we get here, we're updating an existing participant.  Firstly, update
  // the participant record itself.

  await db.query('UPDATE participants SET name=$1 WHERE id=$2',
                 newName, participantId)

  // If the user was updating their own name, change the user record to reflect
  // the new name.

  if (oldName === userName) {
    await db.query('UPDATE users SET name=$1 WHERE id=$2', newName, userId)
  }

  // Finally, redirect the user back to the main participant list.

  response.redirect(302, '/participants')
}

// ==========================================================================

module.exports = async function (request, response) {
  if (!session.isSignedIn(request)) {
    response.redirect(302, '/')
    return
  }

  if (request.method == 'GET') {
    return get(request, response)
  } else if (request.method == 'POST') {
    return post(request, response)
  } else {
    response.status(405) // Method not allowed.
  }
}

