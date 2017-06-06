About the Tai Chi Challenge App
-------------------------------

The Tai Chi Challenge app is designed to provide a simple web site where users
can sign in and record their daily scores -- either for themselves or on behalf
of one or more other people.

A daily score is simply the (integer) number of minutes they have practiced
Taoist Tai Chi that day.

Each user is associated with a branch, and the totals are displayed on an
individual and branch basis.

To implement this app, I'll use Node and Express.  For the database, I'll use
postgres via the "pg" node module.

## Initialising the Database ##

To initialise the database, make sure the `.env` file contains an entry
defining the database to use, like this:

    DATABASE_URL=postgres://postgres@localhost/tai_chi_challenge

You can then run the initialisation script like this:

    heroku local:run node scripts/init_db.js

You then need to populate the list of branches by typing:

    heroku local:run node scripts/load_branches.js

# Database schema #

    CREATE TABLE branches (
        id   SERIAL PRIMARY KEY,
        name TEXT,
        UNIQUE(name)
    );

    CREATE TABLE users (
        id        SERIAL PRIMARY KEY,
        name      TEXT,
        branch_id INTEGER,
        username  TEXT,
        password  TEXT,
        UNIQUE(username)
    );

    CREATE INDEX users_branch ON users(branch_id);

    CREATE TABLE participants (
        id      SERIAL PRIMARY KEY,
        user_id INTEGER,
        name    TEXT,
        UNIQUE(name)
    );

    CREATE INDEX participants_user ON participants(user_id);

    CREATE TABLE times (
        id             SERIAL PRIMARY KEY,
        participant_id INTEGER,
        branch_id      INTEGER,
        date_1         DATE,
        num_minutes_1  INTEGER,
        date_2         DATE,
        num_minutes_2  INTEGER,
        date_3         DATE,
        num_minutes_3  INTEGER,
        date_4         DATE,
        num_minutes_4  INTEGER
    );

    CREATE INDEX times_participant ON times(participant_id);

    CREATE INDEX times_branch ON times(branch_id);

Note that the `times` record holds four sets of times at once.  This isn't
efficient, but lets us use Heroku for free as the app will use far fewer rows
in the database.  We store a copy of the branch ID in the `times` record so we
can quickly calculate the total for a branch.

# Running Locally #

To run the app locally, simple `cd` into the top-level directory and type:

    heroku local web

# Routes #

`/`

This simply redirects the user to `/results` if the user is signed in, or
`/signin` if they aren't.

`/signin`

The sign-in page.  Prompts the user for their sign-in details, and gives them a
button to click to sign up.  Also shows the current set of totals for the
various branches, as well as the total across all branches.

`/signup`

Prompts the user to sign up.

`/results`

The main page shown when the usr first signs in.  Displays the current totals
for the signed-in user and their participants, as well as the branch and the
total across all branches.

`/participants`

Lets the user manage the participants they control.

`/participant/:id`

Let the user add, edit or delete a participant.  `id` will be set to "add" if
we are adding a participant.

# Totals #

We can calculate the totals across each participant, and because each
participant belongs to a branch we can calculate the totals for each branch.
We can also calculate the total across all branches.

Do we want to calculate just one number for each, or do it on a daily (or
weekly) basis?  I think doing it on a total basis is best: one number for the
total to date.

We could have a column chart showing one column for each day.

So...I could calculate the total for each participant, and show:

The minimum
The maximum
The average

I could do the same on a branch level.

(I don't think I want to show the minimum!)

I could then show the average and maximum as a line, with the current value
shown as a bar within the chart, eg:

  |--------------------------- Maximum participant
  |
  |      +-----+
  |      |#####|
  |--------------------------- Average participant
  |      |#####|
  |      |#####|
  |      |#####|
  +------+-----+--------------

