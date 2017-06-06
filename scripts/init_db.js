// init_db.js
//
// This script initialises the tai chi challenge database.  It is designed to
// be run from the command line.
//
// ==========================================================================

var pg = require('pg')
var prompt = require('prompt')

// ==========================================================================
//
// async init_branches(client)
//
//     Initialise the 'branches' table.
//
//     'client' is the Postgres client used to access the database.

async function init_branches(client) {
    await client.query('DROP TABLE IF EXISTS branches')
    await client.query("CREATE TABLE branches (" +
                       "  id   SERIAL PRIMARY KEY," +
                       "  name TEXT," +
                       "  UNIQUE(name))")
    console.log("Created 'branches' table")
}

// ==========================================================================
//
// async init_users(client)
//
//     Initialise the 'users' table.
//
//     'client' is the Postgres client used to access the database.

async function init_users(client) {
    await client.query('DROP TABLE IF EXISTS users')
    await client.query("CREATE TABLE users (" +
                       "  id        SERIAL PRIMARY KEY," +
                       "  name      TEXT," +
                       "  branch_id INTEGER," +
                       "  username  TEXT," +
                       "  password  TEXT," +
                       "  UNIQUE(username))")
    console.log("Created 'users' table")

    await client.query('CREATE INDEX users_branch ' +
                       'ON users(branch_id)')
    console.log("Created 'users_branch' index")
}

// ==========================================================================
//
// async init_participants(client)
//
//     Initialise the 'users' table.
//
//     'client' is the Postgres client used to access the database.

async function init_participants(client) {
    await client.query('DROP TABLE IF EXISTS participants')
    await client.query("CREATE TABLE participants (" +
                       "  id      SERIAL PRIMARY KEY," +
                       "  user_id INTEGER," +
                       "  name    TEXT," +
                       "  UNIQUE(name))")
    console.log("Created 'participants' table")

    await client.query('CREATE INDEX participants_user ' +
                       'ON participants(user_id)')
    console.log("Created 'participants_user' index")
}

// ==========================================================================
//
// async init_times(client)
//
//     Initialise the 'times' table.
//
//     'client' is the Postgres client used to access the database.

async function init_times(client) {
    await client.query('DROP TABLE IF EXISTS times')
    await client.query("CREATE TABLE times (" +
                       "  id             SERIAL PRIMARY KEY," +
                       "  participant_id INTEGER," +
                       "  branch_id      INTEGER," +
                       "  date_1         DATE," +
                       "  num_minutes_1  INTEGER," +
                       "  date_2         DATE," +
                       "  num_minutes_2  INTEGER," +
                       "  date_3         DATE," +
                       "  num_minutes_3  INTEGER," +
                       "  date_4         DATE," +
                       "  num_minutes_4  INTEGER)")
    console.log("Created 'times' table")

    await client.query('CREATE INDEX times_participant ' +
                       'ON times(participant_id)')
    console.log("Created 'times_participant' index")

    await client.query('CREATE INDEX times_branch ' +
                       'ON times(branch_id)')
    console.log("Created 'times_branch' index")
}

// ==========================================================================
//
// async init_db()
//
//     This function does all the work of initialising the database.

async function init_db() {
    console.log("Initialising database...")

    var client = new pg.Client(process.env.DATABASE_URL)
    client.connect()

    try {
        await init_branches(client)
        await init_users(client)
        await init_participants(client)
        await init_times(client)
        console.log("All done!")
    } catch (err) {
        console.log(err)
    }

    client.end()
}

// ==========================================================================

// Confirm the operation with the user.

prompt.start()
prompt.message = ""
prompt.delimiter = ""
prompt.colors = false

var confirm = {
        name: "yesno",
        message: "Initialise DB (Y/N?)?",
        validator: /[yYnN]/,
        warning: "Please respond with Y or N.",
        required: true,
}

prompt.get(confirm, function(err, result) {
    var response = result.yesno
    if ((response == "y") | (response == "Y")) {
        init_db()
    }
})

