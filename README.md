# Trips Application Grader
A small webapp that pull applications from a google sheet and gives people the ability to grade
them.

## Development
* `npm run dev` - Run the app in development mode
* `npm run start` - Run the app in production mode
* `npm run format` - Lint and format code
* `npm run generate-env-vars` - Generate environment variables from the app-config
* `npm run init-db` - Create the database and download applications into it

## Config format
To run the app, create a JSON config file with the following information.

```json
"sheetId": "10Uz3WgMkLQRo9jBCwYykpUjTQiODJZbViia7gjwnl4o",
"progressColumn": "E",
"identifierColumn": "CT",
"questions": [
    {
        "column": "AN",
        "prompt": "Reflect on your own transition to Dartmouth."
    },
    {
        "column": "AO",
        "prompt": "Elaborate on one or two major aspects of yourself (experiences, identities, perspectives, background, etc.) that affect your approach to being a Trips volunteer."
    }
],
"graders": []
```

This allows the app to map a question to the appropriate column, even if the form entry doesn't
create the exact column headers we want in row #1.

To load this config file into the application, it needs to be compressed into a one-line environment
variable. A helper script, `scripts/generate-env-vars.js`, can do this for you: if the config file
has been saved as `app-config.json` in the `/configs` directory, the script will create a `.env`
file in the home directory with the config in it.

The spreadsheet needs to have a "responses" sheet, and a "grades" sheet, where "responses" has all
the application responses, and "grades" is used by the webapp to save grades.

## Database
TODO: Write about SQLite architecture

The first time you run the app, you'll need to load the applications into the database. The script
for this is in the `scripts` directory and can be run with `node scripts/apps-loader.js [OFFSET
NUM]`, where `[OFFSET NUM]` is the number of rows at the beginning of the sheet to exclude (headers
and such). Running that command requires that the `GOOGLE_SERVICE_KEY` and
`GOOGLE_SERVICE_PRIVATE_KEY` env vars be in the current shell session.
