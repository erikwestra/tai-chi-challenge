/* endpoints/index.js
 *
 * This module imports our various endpoints and makes them available to any
 * module that imports the endpoints directory.
 */

module.exports = {
    landing: require('./landing'),
    participants: require('./participants'),
    participant: require('./participant'),
    results: require('./results'),
    signin: require('./signin'),
    signup: require('./signup'),
    signout: require('./signout'),
    times: require('./times')
}
