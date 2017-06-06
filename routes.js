/* routes.js
 *
 * This module defines the Express router used to access our various endpoints.
 */

var router    = require('express').Router()
var endpoints = require('./endpoints')

router.all('/', endpoints.landing)
router.all('/signin', endpoints.signin)
router.all('/signup', endpoints.signup)
router.all('/signout', endpoints.signout)
router.all('/results', endpoints.results)
router.all('/participants', endpoints.participants)
router.all('/participant/:id', endpoints.participant)
router.all('/times', endpoints.times)

module.exports = router
