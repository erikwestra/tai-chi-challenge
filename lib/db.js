/* db.js
 *
 * This module implements a database wrapper for the tai-chi-challenge app.
 *
 * Usage:
 *
 *    db.query("SELECT id FROM table WHERE field=$1", [value])
 *        .then(results => {
 *            ...
 *         })
 *        .catch(err => {
 *            console.error(err)
 *        })
 *
 * Make sure you catch any errors, and log them to the console like in the
 * above example.
 */

var pg  = require('pg')
var url = require('url')

// Create our pool of database connections:

var params = url.parse(process.env.DATABASE_URL)
var auth   = params.auth.split(':')

var config = {
    user     : auth[0],
    password : auth[1] || null,
    host     : params.hostname,
    port     : params.port,
    database : params.pathname.split('/')[1],
    ssl      : false // required for dev???
}

var pool = new pg.Pool(config)

// ==========================================================================
//
// async query(sql, ...args)
//
//    Run a query against the database with the given optional arguments.
//
//    Returns a promise that gets resolved with the results of the query once
//    it has been completed, or null if an error occurs.
//    
//    Note that we display an error message in the console, to help track down
//    errors.

async function query(sql, ...args) {
  try{
    var results = await pool.query(sql, args)
    return results
  } catch (err) {
    console.log('ERROR in db.query()')
    console.log('error: ', err.message)
    console.log('query: ', sql)
    console.log('args:', args)
  }
}

// ==========================================================================
//
// async get_branches()
//
//     Return the list of branches from the database.
//
//     Each entry in the returned array will be an object with 'id' and 'name'
//     fields.  The branches will be in alphabetical order.

async function get_branches() {

    var results = await query('SELECT id,name FROM branches ORDER BY name')
    var branches = []
    for (var i=0; i < results.rows.length; i++) {
        var branch = results.rows[i];
        branches.push({id   : branch.id,
                       name : branch.name})
    }

    branches.sort(function(a, b) {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
    })

    return branches
}

// ==========================================================================
//
// Our public interface:

module.exports = {
    query        : query,
    get_branches : get_branches
}

