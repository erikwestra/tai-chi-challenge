// load_branches.js
//
// This script loads the hardwired list of branches into the tai chi challenge
// database.  It is designed to be run from the command line.
//
// ==========================================================================

var pg     = require('pg')
var prompt = require('prompt')

// ==========================================================================
//
// async delete_branches(client)
//
//     Delete all the existing branches from our table.

async function delete_branches(client) {
    await client.query('DELETE FROM branches')
}

// ==========================================================================
//
// async add_branch(client, branch)
//
//     Add the given branch to our table.

async function add_branch(client, branch) {
    await client.query('INSERT INTO branches (name) VALUES ($1)', [branch])
}

// ==========================================================================
//
// async load_branches()
//
//     This function does all the work of adding the branches.

async function load_branches() {
    console.log("Loading branches...")

    var client = new pg.Client(process.env.DATABASE_URL)
    client.connect()

    try {
        await delete_branches(client)
        await add_branch(client, "Northern")
        await add_branch(client, "Bay of Plenty")
        await add_branch(client, "Rotorua")
        await add_branch(client, "Waikato")
        await add_branch(client, "Wellington")
        await add_branch(client, "Nelson")
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
        message: "Load branches (Y/N?)?",
        validator: /[yYnN]/,
        warning: "Please respond with Y or N.",
        required: true,
}

prompt.get(confirm, function(err, result) {
    var response = result.yesno
    if ((response == "y") | (response == "Y")) {
        load_branches()
    }
})

