# Trips Application Grader

A small webapp that pull applications from a google sheet and gives people the ability to grade them.

## Config format

To run the app, create a JSON config file with the following information.

```json
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
	]
```

This allows the app to map a question to the appropriate column, even if the form entry doesn't create the exact column headers we want in row #1.

To load this config file into the application, it needs to be compressed into a one-line environment variable. A helper script, `scripts/generate-env-vars.js`, can do this for you: if the config file has been saved as `app-config.json` in the `/configs` directory, the script will create a `.env` file in the home directory with the config in it.

## Redis

TODO: Write about redis architecture

The first time you run redis, you'll need to load the applications into the database. The script for this is in the `scripts` directory and can be run with `node scripts/apps-loader.js [OFFSET NUM]`, where `[OFFSET NUM]` is the number of rows at the beginning of the sheet to exclude (headers and such). Running that command requires that the `GOOGLE_SERVICE_KEY` and `GOOGLE_SERVICE_PRIVATE_KEY` env vars be in the current shell session.

For Heroku, where this is currently deployed, you can create a one-off dyno to run the script with `heroku run node scripts/apps-loader.js [OFFSET NUM]`. A similar method is used in production to fetch new apps occasionally, which may have gotten an extension.
