# Trips Application Grader

A small webapp that pull applications from a google sheet and gives people the ability to grade them.

## Config format

To run the app, create a JSON config file with the following information. This file should be saved as `app-config.json` in the source/build root directory.

```json
[
	{
		"column": "D",
		"prompt": "Why do you want to join trips?"
	},
	{
		"column": "E",
		"prompt": "What's something you want to improve about your experience?"
	}
]
```

This allows the app to map a question to the appropriate column, even if the form entry doesn't create the exact column headers we want in row #1.
