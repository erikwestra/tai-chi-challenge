/* chartcalc.js
 *
 * This module calculates the underlying data for our various charts.
 */

var db = require('./db')
var timestore = require('./timestore')

// ==========================================================================
//
// async numParticipantsPerBranch()
//
//     Calculate and return the number of participants we have per branch.
//
//     We return a Map object mapping branch names to the number of
//     participants in that branch.

async function calcNumParticipantsPerBranch () {

  var branchNames = new Map() // Maps branch ID to name.

  var results = await db.query('SELECT id,name FROM branches')
  for (var i=0; i < results.rows.length; i++) {
    var row = results.rows[i]
    branchNames.set(row.id, row.name)
  }

  var totals = new Map() // Maps branch name to number of participants.

  var results = await db.query('SELECT COUNT(participants.*) AS count,' +
                               'users.branch_id AS branch_id ' +
                               'FROM participants,users ' +
                               'WHERE participants.user_id=users.id ' +
                               'GROUP BY users.branch_id')
  for (var i=0; i < results.rows.length; i++) {
    var row = results.rows[i]
    totals.set(branchNames.get(row.branch_id), row.count)
  }

  return totals
}

// ==========================================================================
// 
// async buildChartsForUser(userId)
//
//     Build the set of charts to display when signed in as the given user.  We
//     create a chart for each of the user's participants, as well as a chart
//     for the user's branch and the Society as a whole.
//
//     The returned array will have one entry for each chart, where each chart
//     is an object with the following fields:
//
//         'title'
//         'value'
//         'max'

async function buildChartsForUser (userId) {

  // Get the user's branch ID and name.

  var results = await db.query('SELECT branches.name AS name, ' +
                               'branches.id AS id ' +
                               'FROM branches,users ' +
                               'WHERE (branches.id = users.branch_id) ' +
                               'AND (users.id = $1)', userId)
  if (results.rows.length != 1) {
    console.log('INVALID userId: ', userId)
    return []
  }

  var branchId = results.rows[0].id
  var branchName = results.rows[0].name

  // Calculate the other information we'll need.

  var numParticipantsPerBranch = await calcNumParticipantsPerBranch()
  var participantTotals = await timestore.calcParticipantTotals(userId)
  var branchTotals = await timestore.calcBranchTotals()

  // Get the national goal from our environment variable.

  var nationalGoal = parseInt(process.env.NATIONAL_GOAL)

  // Calculate the total number of participants across all branches.

  var totNumParticipants = 0
  numParticipantsPerBranch.forEach(function(numParticipants, branchName) {
    totNumParticipants = totNumParticipants + numParticipants
  })

  // Calculate the total across all the branches.

  var totalTotal = 0
  branchTotals.forEach(function(numMinutes, branchId) {
    totalTotal = totalTotal + numMinutes
  })

  // Calculate the goal for each participant.  This is simply the national
  // goal divided by the number of participants.

  var participantGoal = Math.floor(nationalGoal / totNumParticipants)

  // Calculate the goal for this branch.  This is based on the national goal
  // and the number of participants in this branch.

  var numParticipantsInBranch = numParticipantsPerBranch.get(branchName)

  var branchGoal = Math.floor(nationalGoal *
                              (numParticipantsInBranch / totNumParticipants))

  // Start building our list of charts.

  charts = []

  // Create a chart for each participant.

  for (var i=0; i < participantTotals.length; i++) {
    var name = participantTotals[i].participant
    var total = participantTotals[i].total
    charts.push({
      title: name,
      value: total,
      max: participantGoal
    })
  }

  // Create a chart for this branch.

  charts.push({
    title: branchName + ' Branch',
    value: branchTotals.get(branchId),
    max: branchGoal
  })

  // Finally, calculate a chart for the Society as a whole.

  charts.push({
    title: 'National Goal',
    value: totalTotal,
    max: nationalGoal
  })

  // That's all, folks!

  return charts
}

// ==========================================================================
// 
// async buildSummaryCharts()
//
//     Build the set of charts to display when the user is not signed in.  We 
//     create a chart for each branch, and for the Society as a whole.
//
//     The returned array will have one entry for each chart, where each chart
//     is an object with the following fields:
//
//         'title'
//         'value'
//         'max'

async function buildSummaryCharts () {

  // Get a list of all the branches and their IDs.

  var branches = await db.get_branches()

  // Calculate the other information we'll need.

  var numParticipantsPerBranch = await calcNumParticipantsPerBranch()
  var branchTotals = await timestore.calcBranchTotals()

  // Get the national goal from our environment variable.

  var nationalGoal = parseInt(process.env.NATIONAL_GOAL)

  // Calculate the total number of participants across all branches.

  var totNumParticipants = 0
  numParticipantsPerBranch.forEach(function(numParticipants, branchName) {
    totNumParticipants = totNumParticipants + numParticipants
  })

  // Calculate the total across all the branches.

  var totalTotal = 0
  branchTotals.forEach(function(numMinutes, branchId) {
    totalTotal = totalTotal + numMinutes
  })

  // Calculate the goal for each branch.  This is based on the national goal
  // and the number of participants in this branch.

  var branchGoals = new Map() // Maps branch ID to target number of minutes.

  for (var i=0; i < branches.length; i++) {
    var branch = branches[i]
    var numParticipantsInBranch = numParticipantsPerBranch.get(branch.name)
    var branchGoal = Math.floor(nationalGoal *
                                (numParticipantsInBranch / totNumParticipants))
    branchGoals.set(branch.id, branchGoal)
  }

  // Start building our list of charts.

  charts = []

  // Create a chart for each branch.

  for (var i=0; i < branches.length; i++) {
    var branch = branches[i]
    var total = branchTotals.get(branch.id)
    var goal = branchGoals.get(branch.id)

    charts.push({
      title: branch.name,
      value: total,
      max: goal
    })
  }

  // Finally, calculate a chart for the Society as a whole.

  charts.push({
    title: 'National Goal',
    value: totalTotal,
    max: nationalGoal
  })

  // That's all, folks!

  return charts
}

// ==========================================================================
//
// Our public interface:

module.exports = {
  calcNumParticipantsPerBranch,
  buildChartsForUser,
  buildSummaryCharts
}
