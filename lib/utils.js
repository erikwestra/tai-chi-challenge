/* utils.js
 *
 * This module defines a number of utility functions which can be used
 * throughout the system.
 */

// ==========================================================================
//
// addLeadingZeros(n, numDigits)
//
//     Convert the given number to a string, adding leading zeros as required
//     to ensure the resulting string has the given number of digits.

function addLeadingZeros (n, numDigits) {
  var s = n.toString()
  while (s.length < numDigits) {
    s = '0' + s
  }
  return s
}

// ==========================================================================
//
// elapsedTimeToString(num_minutes)
//
//     Convert the given elapsed time value into a string in HH:MM format.

function elapsedTimeToString (num_minutes) {
  if (num_minutes < 60) {
    return num_minutes.toString()
  } else {
    var hours = Math.floor(num_minutes/60)
    var minutes = num_minutes - (60 * hours)
    return hours.toString() + ':' + addLeadingZeros(minutes, 2)
  }
}

// ==========================================================================
//
// elapsedTimeFromString(s)
//
//     Convert a value entered by the user into an elapsed time value.
//
//     The user can either enter an integer number of minutes, or an HH:MM
//     value.
//
//     We return the entered value, as a whole number of minutes.  If the user
//     didn't type a valid value, we return null.

function elapsedTimeFromString (s) {
  if (!s) {
    return null
  }

  var parts = s.split(':')
  if (parts.length > 2) {
    return null
  }

  var hours = 0
  var minutes = 0

  if (parts.length == 1) {
    try {
      minutes = parseInt(parts[0])
    } catch (err) {
      return null
    }
  } else {
    try {
      hours = parseInt(parts[0])
      minutes = parseInt(parts[1])
    } catch (err) {
      return null
    }
  }

  return 60 * hours + minutes
}

// ==========================================================================
//
// Our public interface:

module.exports = {
  addLeadingZeros,
  elapsedTimeToString,
  elapsedTimeFromString
}
