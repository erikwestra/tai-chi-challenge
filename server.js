/* app.js
 *
 * This is the main entry point for the Tai Chi Challenge app.
 */

var express = require('express')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var Moment = require('moment')
var pg = require('pg')

// Setup our Express HTTP server.

var app = express()

app.set('view engine', 'ejs')
app.use(express.static('assets'))
app.use(cookieParser("TAICHICHALLENGE"))
app.use(bodyParser.urlencoded({extended:true}))

// Force the database to return date objects as JS Moment dates.

pg.types.setTypeParser(1083, function(val) {
  return val === null ? null : Moment(val).format('YYYY-MM-DD')
})

// Insert the routes to our various endpoints.

app.use(require('./routes'))

// Run the server.

var port = process.env.PORT
if (!port) {
  port = 8080
}

var server = app.listen(port, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("Tai Chi Challenge app listening at http://%s:%s", host, port)
})
