/* DateValue.js
 *
 * This module defines a DateValue class which represents dates.
 */

var utils = require('./utils')

// ==========================================================================

class DateValue {

  // ========================================================================
  //
  // new DateValue(year, month, day)
  //
  //     Construct and return a new DateValue object.
  //
  //     The parameters are as follows:
  //
  //         `year`
  //
  //             The year number as an integer, for example 2017.
  //
  //         `month`
  //
  //             The month number as an integer in the range 1-12.
  //
  //         `day`
  //
  //             The day number as an integer in the range 1-31.

  constructor (year, month, day) {
      this.year = year
      this.month = month
      this.day = day
  }

  // ========================================================================
  //
  // DateValue.clone(date)
  //
  //     Construct and return a new DateValue object which is a copy of the
  //     given date.
  //
  //     `date` should be a DateValue object.

  static clone (date) {

    return new DateValue(date.year, date.month, date.day)
  }

  // ========================================================================
  //
  // DateValue.fromString(s)
  //
  //     Construct and return a new DateValue object by parsing a string.
  //
  //     `s` should be be a string of the form 'YYYY-MM-SS', which is parsed to
  //     obtain the date values.
  //
  //     If the string cannot be parsed, we return null.
  
  static fromString (s) {
    var parts = s.split('-')
    if (parts.length != 3) {
      return null
    }
    try {
      var year = parseInt(parts[0])
      var month = parseInt(parts[1])
      var day = parseInt(parts[2])
      return new DateValue(year, month, day)
    } catch (err) {
        return null
    }
  }

  // ========================================================================
  //
  // toString()
  //
  //     Return this date value converted to a string of the form YYYY-MM-DD.

  toString () {
    return utils.addLeadingZeros(this.year, 4) + '-'
         + utils.addLeadingZeros(this.month, 2) + '-'
         + utils.addLeadingZeros(this.day, 2)
  }

  // ========================================================================
  //
  // equals(date)
  //
  //     Return true if and only if this date value equals `date`.

  equals (date) {
    if (this.year != date.year) {
      return false
    } else if (this.month != date.month) {
      return false
    } else if (this.day != date.day) {
      return false
    } else {
      return true
    }
  }

  // ========================================================================
  //
  // lessThan(date)
  //
  //     Return true if and only if this date value is less than `date`.

  lessThan (date) {
    if (this.year < date.year) {
      return true
    } else if (this.month < date.month) {
      return true
    } else if (this.day < date.day) {
      return true
    } else {
      return false
    }
  }

  // ========================================================================
  //
  // greaterThan(date)
  //
  //     Return true if and only if this date value is greater than `date`.

  greaterThan (date) {
    if (this.year > date.year) {
      return true
    } else if (this.month > date.month) {
      return true
    } else if (this.day > date.day) {
      return true
    } else {
      return false
    }
  }

  // ========================================================================
  //
  // addMonth(date)
  //
  //     Add one calendar month to this date value.

  addMonth () {
    if (this.month == 12) {
      this.year = this.year + 1
      this.month = 1
    } else {
      this.month = this.month + 1
    }
  }

  // ========================================================================
  //
  // subtractMonth(date)
  //
  //     Subtract one calendar month from this date value.

  subtractMonth () {
    if (this.month == 1) {
      this.year = this.year - 1
      this.month = 12
    } else {
      this.month = this.month - 1
    }
  }
}

// ==========================================================================
//
// Our public interface:

module.exports = DateValue
