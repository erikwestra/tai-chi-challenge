/* session.js
 *
 * This module implements a simple cookie-based session system.
 */

var db = require('./db')

// ==========================================================================
//
// signIn(userId, response)
// 
//      Remember that the user is currently signed in.
//
//      `userId` is the record ID of the user who has just signed in, and
//      `response` is the HTTP response object.

function signIn (userId, response) {
  response.cookie('user_id', userId)
}

// ==========================================================================
//
// signOut(response)
// 
//      Sign the current user out.
//
//      `response` is the HTTP response object.

function signOut (request, response) {
  if ('user_id' in request.cookies) {
    response.clearCookie('user_id')
  }
}

// ==========================================================================
//
// isSignedIn(request)
//
//     Is the user currently logged in?
//
//     `request` is the HTTP request object.

function isSignedIn (request) {
  return ('user_id' in request.cookies)
}

// ==========================================================================
//
// getUserId(request)
// 
//      Get the record ID of the currently signed-in user.
//
//      `request` is the HTTP request object.

function getUserId (request) {
  if (isSignedIn(request)) {
    return request.cookies.user_id
  } else {
    return null
  }
}

// ==========================================================================
//
// async getUserName(request)
//
//      Get the name of the currently signed-in user.
//
//      `request` is the HTTP request object.

async function getUserName (request) {
  if (isSignedIn(request)) {
    var results = await db.query('SELECT name FROM users WHERE id=$1',
                                 request.cookies.user_id)

    if (results.rows.length != 1) {
      return 'MISSING USER!'
    }

    return results.rows[0].name
  } else {
    return null
  }
}

// ==========================================================================
//
// async getUserBranch(request)
//
//      Get the branch of the currently signed-in user.
//
//      `request` is the HTTP request object.
//
//      We return an object with 'name' and 'id' properties.

async function getUserBranch (request) {
  if (isSignedIn(request)) {
    var results = await db.query('SELECT branch_id FROM users WHERE id=$1',
                                 request.cookies.user_id)

    if (results.rows.length != 1) {
      return 'MISSING USER!'
    }

    var branch_id = results.rows[0].branch_id

    var results = await db.query('SELECT name FROM branches WHERE id=$1',
                                 branch_id)

    if (results.rows.length != 1) {
      return {name: 'MISSING BRANCH!',
              id: -1}
    }

    return {name: results.rows[0].name,
            id: branch_id}
  } else {
    return null // Should never happen.
  }
}

// ==========================================================================
//
// async getUserParticipants(request)
//
//      Get the list of participants for the currently signed-in user.
//
//      `request` is the HTTP request object.
//
//      We return a list of participants in alphabetical order.  Each
//      participant is an object with 'id' and 'name' entries.

async function getUserParticipants (request) {
  if (isSignedIn(request)) {
    var results = await db.query('SELECT id,name FROM participants ' +
                                 'WHERE user_id=$1 ' +
                                 'ORDER BY name',
                                 request.cookies.user_id)

    participants = []
    for (var i=0; i < results.rows.length; i++) {
      participants.push({id: results.rows[i].id,
                         name: results.rows[i].name})
    }

    return participants
  } else {
    return null
  }
}

// ==========================================================================
//
// Our public interface:

module.exports = {
  signIn,
  signOut,
  isSignedIn,
  getUserId,
  getUserName,
  getUserBranch,
  getUserParticipants
}
