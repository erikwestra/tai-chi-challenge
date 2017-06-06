/* timestore.js
 *
 * This module implements the logic of adding, updating, and summarising the
 * time values entered by the user.  It provides a wrapper around the `times`
 * table in the database, allowing for the fact that we store multiple time
 * entries per record.
 */

var db = require('./db')
var DateValue = require('./DateValue')

// ==========================================================================
//
// async set(participantId, date, numMinutes)
//
//     Set the number of minutes recorded by the given participant on the given
//     date.
//     
//     `date` should be a string of the form 'YYYY-MM-DD', as returned by the
//     DateValue.toString() method.

async function set (participantId, date, numMinutes) {

  // Start by getting the branch ID for the given participant.  We store this
  // into the `times` table to speed up our searches.

  var results = await db.query('SELECT users.branch_id AS branch_id ' +
                               'FROM users,participants ' +
                               'WHERE (participants.id=$1) ' +
                               'AND (participants.user_id = users.id)',
                               participantId)
  if (results.rows.length != 1) {
    console.log("Unknown participant: ", participantId)
    return
  }

  var branchId = results.rows[0].branch_id

  // If we have an existing entry in the 'times' table for this date, update
  // it.

  for (var n=1; n < 5; n++) {
    var results = await db.query(`SELECT id,num_minutes_${n} as num_minutes ` +
                                 'FROM times WHERE participant_id=$1 ' +
                                 `AND date_${n}=$2`,
                                 participantId, date)
    if (results.rows.length == 1) {
      if (results.rows[0].num_minutes != numMinutes) {
        // Value has changed -> update it.
        var id = results.rows[0].id
        await db.query(`UPDATE times SET num_minutes_${n}=$1 WHERE id=$2`,
                       numMinutes, id)
      }
      return
    }
  }

  // If we get here, there is no 'times' record containing this date -> we have
  // to add it.  We start by looking for a 'times' record with blank space.

  for (var n=1; n < 5; n++) {
    var results = await db.query('SELECT id FROM times ' +
                                 'WHERE (participant_id=$1)' +
                                 `AND (date_${n} IS NULL)`,
                                 participantId)
    if (results.rows.length == 1) {
      // We found a spare slot -> use it.
      var id = results.rows[0].id
      return db.query(`UPDATE times SET date_${n}=$1, num_minutes_${n}=$2 ` +
                      'WHERE id=$3', date, numMinutes, id)
    }
  }

  // If we get here, there are no 'times' records with any spare room -> create
  // a new one.

  return db.query('INSERT INTO times ' +
                  '(participant_id, branch_id, date_1, num_minutes_1) ' +
                  'VALUES ($1, $2, $3, $4)',
                  participantId, branchId, date, numMinutes)
}

// ==========================================================================
//
// async get(participantId, date)
//
//     Retrieve the number of minutes recorded by the given participant on the
//     given date.
//
//     `date` should be a string of the form 'YYYY-MM-DD', as returned by the
//     DateValue.toString() method.
//     
//     If there is no data for this participant on this day, we return zero.

async function get (participantId, date) {

  var numMinutes = 0
  for (var n=1; n < 5; n++) {
    var results = await db.query(
      `SELECT num_minutes_${n} AS num_minutes ` +
      `FROM times WHERE (participant_id=$1) AND (date_${n} = $2)`,
      participantId, date)
    if (results.rows.length > 0) {
      numMinutes = results.rows[0].num_minutes
      break
    }
  }
  return num_minutes
}

// ==========================================================================
//
// async getRange(participantId, startDate, endDate)
//
//     Retrieve the number of minutes recorded by the given participant on the
//     given range of dates.
//
//     `startDate` and `endDate` should be strings of the form 'YYYY-MM-DD', as
//     returned by the DateValue.toString() method.
//
//     Upon completion, we return a Map object mapping dates (strings of the
//     form 'YYYY-MM-DD') to the number of days recorded for that date.

async function getRange (participantId, startDate, endDate) {

  var times = new Map() // Maps YYYY-MM-DD to number of minutes.

  for (var n=1; n < 5; n++) {
    var results = await db.query(
      `SELECT EXTRACT(YEAR FROM date_${n}) AS year,` +
      `       EXTRACT(MONTH FROM date_${n}) AS month,` +
      `       EXTRACT(DAY FROM date_${n}) AS day, ` +
      `       num_minutes_${n} AS num_minutes ` +
      'FROM times WHERE (participant_id=$1) AND ' +
      `(date_${n} >= $2) AND (date_${n} <= $3)`,
      participantId, startDate, endDate)

    for (var i=0; i < results.rows.length; i++) {
      var row = results.rows[i]
      var date = new DateValue(row.year, row.month, row.day).toString()
      times.set(date, row.num_minutes)
    }
  }

  return times
}

// ==========================================================================
//
// async calcParticipantTotals(userId)
//
//     Calculate the totals on a participant-by-participant basis for the
//     given user.
//
//     We return an array of objects with `participant` and `total` properties,
//     where `participant` is the name of the participant and `total` is the
//     total number of minutes logged by that participant.  The participants
//     will be in alphabetical order.

async function calcParticipantTotals (userId) {

  var participants = [] // List of participants for this user.  Each
                        // participant has `id` and `name` fields.

  var results = await db.query('SELECT id,name FROM participants ' +
                               'WHERE user_id=$1', userId)
  for (var i=0; i < results.rows.length; i++) {
    participants.push({id: results.rows[i].id,
                       name: results.rows[i].name})
  }

  participants.sort(function(a, b) {
    if (a.name < b.name) {
      return -1
    } else if (a.name > b.name) {
      return 1
    } else {
      return 0
    }
  })

  var totals = []

  for (var i=0; i < participants.length; i++) {
    var participant = participants[i]

    var total = 0
    for (var n=1; n < 5; n++) {
      var results = await db.query(`SELECT SUM(num_minutes_${n}) AS total ` +
                                   'FROM times WHERE participant_id = $1',
                                   participant.id)
      for (var j=0; j < results.rows.length; j++) {
        var rowTotal = results.rows[j].total
        // For some reason, pg is returning the SUM(...) result as a string.
        // It will also be set to null if there are no values for a particular
        // field.
        if (rowTotal) {
          total = total + parseInt(rowTotal)
        }
      }
    }

    totals.push({participant: participant.name,
                 total: total})
  }

  return totals
}

// ==========================================================================
//
// async calcBranchTotals()
//
//     Calculate the totals on a branch-by-branch basis.
//
//     We return a Map object mapping branch IDs to the total number of minutes
//     logged by the participants within that branch.

async function calcBranchTotals () {

  var branches = [] // List of branches.  Each list item will be an object with
                    // 'id' and 'name' properties.

  var results = await db.query('SELECT id,name FROM branches')
  for (var i=0; i < results.rows.length; i++) {
    var branch = results.rows[i]
    branches.push({id: branch.id,
                   name: branch.name})
  }

  var totals = new Map()

  for (var i=0; i < branches.length; i++) {
    var branch = branches[i]

    var total = 0
    for (var n=1; n < 5; n++) {
      var results = await db.query(`SELECT SUM(num_minutes_${n}) AS total ` +
                                   'FROM times WHERE branch_id = $1',
                                   branch.id)
      for (var j=0; j < results.rows.length; j++) {
        var rowTotal = results.rows[j].total
        // For some reason, pg is returning the SUM(...) result as a string.
        // It will also be set to null if there are no values for a particular
        // field.
        if (rowTotal) {
          total = total + parseInt(rowTotal)
        }
      }
    }

    totals.set(branch.id, total)
  }

  return totals
}
// ==========================================================================
//
// Our public interface:

module.exports = {
  set,
  get,
  getRange,
  calcParticipantTotals,
  calcBranchTotals
}
