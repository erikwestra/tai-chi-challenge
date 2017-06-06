/* endpoints/times.js
 *
 * This module implements the "/times" endpoint for our application.
 */

/*
    Enter Times for [Participant]:

    [Previous Month]                   [Next Month]

     Mon    Tue    Wed    Thur   Fri    Sat    Sun
    -----  -----  -----  -----  -----  -----  -----
    dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm
    [___]  [___]  [___]  [___]  [___]  [___]  [___]
    -----  -----  -----  -----  -----  -----  -----
    dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm
    [___]  [___]  [___]  [___]  [___]  [___]  [___]
    -----  -----  -----  -----  -----  -----  -----
    dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm
    [___]  [___]  [___]  [___]  [___]  [___]  [___]
    -----  -----  -----  -----  -----  -----  -----
    dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm
    [___]  [___]  [___]  [___]  [___]  [___]  [___]
    -----  -----  -----  -----  -----  -----  -----
    dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm  dd/mm
    [___]  [___]  [___]  [___]  [___]  [___]  [___]


    [Save]                                 [Cancel]

*/

var calendar = require('calendar')

var db = require('../lib/db')
var session = require('../lib/session')
var DateValue = require('../lib/DateValue')
var timestore = require('../lib/timestore')
var utils = require('../lib/utils')

// ==========================================================================
// 
// buildCalendar(year, month)
//
//     Build and return a calendar for the given year and month.
//
//     `year` should be a year number (eg, 2017), and `month` should be a month
//     number (1-12, where 1 = January).
//
//     We construct and return an array of weeks to display in our calendar
//     view.  Each week's entry will consist of an array with seven entries,
//     one for each day of the week (0 = monday, 1 = tuesday, etc).  Each day's
//     entry in the calendar will be an object with the following fields:
//
//         'isCurMonth'
//
//             Is this date in the current month?
//
//         'year'
//
//             The year number for this date.
//
//         'month'
//
//             The month number for this date (1-12).
//
//         'day'
//
//             The day number for this date [1-31].

function buildCalendar (year, month) {
  var cal = new calendar.Calendar(1) // 1 = week starts on Monday.
  
  // Calculate the days in the current month.

  var daysInCurMonth = cal.monthDays(year, month-1)

  // Calculate the days in the previous month.

  var prevYear
  var prevMonth

  if (month == 1) {
    prevYear = year - 1
    prevMonth = 12
  } else {
    prevYear = year
    prevMonth = month - 1
  }

  var daysInPrevMonth = cal.monthDays(prevYear, prevMonth-1)

  // Calculate the days in the next month.

  var nextMonth
  var nextYear

  if (month == 12) {
    nextYear = year + 1
    nextMonth = 1
  } else {
    nextYear = year
    nextMonth = month + 1
  }

  var daysInNextMonth = cal.monthDays(nextYear, nextMonth-1)

  // Assemble the calendar.

  var firstWeekInMonth = []

  for (var day=0; day < 7; day++) {
    var dayOfMonth = daysInCurMonth[0][day]
    if (dayOfMonth == 0) {
      // This day is in the previous month.
      var dayOfPrevMonth = daysInPrevMonth[daysInPrevMonth.length-1][day]
      firstWeekInMonth.push({
        isCurMonth: false,
        year: prevYear,
        month: prevMonth,
        day: dayOfPrevMonth
      })
    } else {
      // This day is in the current month.
      firstWeekInMonth.push({
        isCurMonth: true,
        year: year,
        month: month,
        day: dayOfMonth
      })
    }
  }

  var rows = []
  rows.push(firstWeekInMonth)

  for (var week=1; week < daysInCurMonth.length-1; week++) {
    var row = []
    for (var day=0; day < 7; day++) {
      var dayOfMonth = daysInCurMonth[week][day]
      row.push({
        isCurMonth: true,
        year: year,
        month: month,
        day: dayOfMonth
      })
    }
    rows.push(row)
  }

  var lastWeekInMonth = []

  for (var day=0; day < 7; day++) {
    var dayOfMonth = daysInCurMonth[daysInCurMonth.length-1][day]
    if (dayOfMonth == 0) {
      // This day is in the next month.
      var dayOfNextMonth = daysInNextMonth[0][day]
      lastWeekInMonth.push({
        isCurMonth: false,
        year: nextYear,
        month: nextMonth,
        day: dayOfNextMonth
      })
    } else {
      // This day is in the current month.
      lastWeekInMonth.push({
        isCurMonth: true,
        year: year,
        month: month,
        day: dayOfMonth
      })
    }
  }

  rows.push(lastWeekInMonth)

  return rows
}

// ==========================================================================
//
// getRows(year, month, participantId)
//
//     Return the list of rows needed to build a calendar view.
//
//     `year` is the desired year number (eg, 2017), and `month` is the desired
//     month number (1-12, where 1 = January).  `participantId` is the record
//     ID of the participant we want to view the data for.
//
//     We construct and return an array of weeks to display in our calendar
//     view.  Each week's entry will consist of an array with seven entries,
//     one for each day of the week (0 = monday, 1 = tuesday, etc).  Each day's
//     entry in the calendar will be an object with the following fields:
//
//         'isCurMonth'
//
//             Is this date in the current month?
//
//         'year'
//
//             The year number for this date.
//
//         'month'
//
//             The month number for this date (1-12).
//
//         'day'
//
//             The day number for this date [1-31].
//
//         'numMinutes'
//
//             The number of minutes currently recorded by this participant on
//             this day, or `null` if no data has been recorded for this date.

async function getRows (year, month, participantId) {

  // Start by building a list of all the times recorded by this participant for
  // the current month.  Note that we're a bit lazy here, and include the first
  // day of the following month -- this won't matter as we'll ignore this day
  // when assembling the calendar.

  var date = new DateValue(year, month, 1)

  var start_date = date.toString()
  date.addMonth()
  var end_date = date.toString()

  var times = await timestore.getRange(participantId, start_date, end_date)

  // Build the calendar itself.

  var rows = buildCalendar(year, month)

  // Add the participant's recorded times to the calendar.

  for (var week=0; week < rows.length; week++) {
    for (var day=0; day < rows[week].length; day++) {
      var entry = rows[week][day]
      if (entry.isCurMonth) {
        var date = new DateValue(entry.year, entry.month, entry.day)
        var key = date.toString()
        if (times.has(key) && (times.get(key) > 0)) {
          entry.num_minutes = utils.elapsedTimeToString(times.get(key))
        } else {
          entry.num_minutes = null
        }
      } else {
        entry.num_minutes = null
      }
    }
  }

  // That's all, folks!

  return rows
}

// ==========================================================================
//
// buildPage(request, response)
//
//     Construct the HTML page to display.

async function buildPage(request, response) {
  var name = await session.getUserName(request)
  var participants = await session.getUserParticipants(request)

  // Get the query-string parameters, or calculate default values if these
  // haven't been supplied.

  var year
  if (request.query.year) {
    year = parseInt(request.query.year)
  } else {
    year = new Date().getFullYear()
  }

  var month
  if (request.query.month) {
    month = parseInt(request.query.month)
  } else {
    month = new Date().getMonth() + 1
  }

  var curMonth = new DateValue(year, month, 1)

  var participantId
  if (request.query.participantId) {
    participantId = parseInt(request.query.participantId)
  } else {
    var userName = await session.getUserName(request)
    var participants = await session.getUserParticipants(request)

    var participantId = null // initially.
    for (var i=0; i < participants.length; i++) {
      if (participants[i].name === userName) {
        participantId = participants[i].id
        break
      }
    }
  }

  // If the current month starts prior to the start date, set the current month
  // to the start of the month containing the start date.

  if (process.env.START_DATE) {
    var startDate = DateValue.fromString(process.env.START_DATE)
    if (startDate) {
      if (startDate.greaterThan(curMonth)) {
        // We have to move the current month forward to include the start date.
        curMonth = startDate
        curMonth.day = 1
      }
    }
  }

  // If the current month ends after the end date, set the current month to the
  // start of the month containing the end date.

  if (process.env.END_DATE) {
    var endDate = DateValue.fromString(process.env.END_DATE)
    if (endDate) {
      var nextMonth = DateValue.clone(curMonth)
      nextMonth.addMonth()
      if (nextMonth.greaterThan(endDate) || nextMonth.equals(endDate)) {
        // We have to move the current month back to include the end date.
        curMonth = endDate
        curMonth.day = 1
      }
    }
  }

  // Calculate the next and previous dates to use.

  var prevMonth = DateValue.clone(curMonth)
  prevMonth.subtractMonth()

  var nextMonth = DateValue.clone(curMonth)
  nextMonth.addMonth()

  // See if the user can go to the next or previous month.

  var canGoToPreviousMonth = true // initially
  if (startDate) {
    if (startDate.greaterThan(prevMonth)) {
      canGoToPreviousMonth = false
    }
  }

  var canGoToNextMonth = true // initially
  if (endDate) {
    if (nextMonth.greaterThan(endDate)) {
      canGoToNextMonth = false
    }
  }

  // Calculate the date to display at the top of the calendar.

  var MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]

  var dateLabel = MONTH_NAMES[curMonth.month-1]+" "+curMonth.year.toString()

  // Get the calendar data to display.

  var rows = await getRows(curMonth.year, curMonth.month, participantId)

  // Finally, display the data to the user.

  response.render('times', {
    name,
    curView: 'times',
    participants,
    participantId,
    curMonth,
    prevMonth,
    nextMonth,
    dateLabel,
    canGoToPreviousMonth,
    canGoToNextMonth,
    rows
  })
}

// ==========================================================================
//
// get(request, response)
//
//     Respond to an HTTP 'GET' request.
//
//     Note that we simply call buildPage() to do all the work.

async function get (request, response) {
  return buildPage(request, response)
}

// =========================================================================
//
// post(request, response)
//
//     Respond to an HTTP 'POST' request.
//
//     We save the entered data, and then call buildPage() to display the page
//     again.

async function post (request, response) {

  var participantId = parseInt(request.body.participantId)
  var year = parseInt(request.body.year)
  var month = parseInt(request.body.month)

  for (var day=1; day <= 31; day++) {
    var field = 'num_days_' + day
    if (field in request.body) {
      var numMinutes = utils.elapsedTimeFromString(request.body[field])
      if (numMinutes != null) {
        var date = new DateValue(year, month, day)
        var dateStr = date.toString()
        await timestore.set(participantId, dateStr, numMinutes)
      }
    }
  }

  return buildPage(request, response)
}

// =========================================================================
//
// Our endpoint:

module.exports = async function (request, response) {
  if (!session.isSignedIn(request)) {
    response.redirect(302, '/')
    return
  }

  if (request.method == 'GET') {
    await get(request, response)
  } else if (request.method == 'POST') {
    await post(request, response)
  } else {
    response.status(405) // Method not allowed.
  }
}
