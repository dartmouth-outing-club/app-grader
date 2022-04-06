import fs from 'fs'
import path from 'path'

const CONFIG_ROUTE = path.join(process.cwd(), 'app-config.json')

// Read in the config file on module load
const data = fs.readFileSync(CONFIG_ROUTE)
const config = JSON.parse(data.toString())

// Map the letter of the config file to the index of the array
const indices = config.questions.map((item) => columnLetterToArrayIndex(item.column))
const identifierIndex = columnLetterToArrayIndex(config.identifierColumn)
const progressIndex = config.progressColumn
	? columnLetterToArrayIndex(config.progressColumn)
	: undefined

/**
 * Conver the letter of a sheet column (i.e. "D" or "AC") to its array index.
 * For example: "C" -> 2
 * @param {string} letter
 * @returns the array index at which that column can be found
 */
function columnLetterToArrayIndex(letter) {
	// https://stackoverflow.com/questions/21229180/convert-column-index-into-corresponding-column-letter/21231012#21231012
	var column = 0,
		length = letter.length
	for (var i = 0; i < length; i++) {
		column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1)
	}
	return column - 1
}

/** Get the the application questions from the config file */
function getQuestions() {
	return config.questions.map((item) => item.prompt)
}

/**
 * Get the headers from the sheet, based on the columns in the config file.
 * We're not using this right now, since the headers on the sheet could be something like "Question 1",
 * hence the config file, but I already wrote it so...
 *
 * @param sheet a single sheet from a Google Sheets V4 API
 * @returns the first row (headers) of the columns denoted in the config file
 */
export function getHeaders(sheet) {
	// Get the first row from the rowData
	let headerRow
	try {
		headerRow = sheet.data[0].rowData[0]
	} catch (error) {
		console.error(error)
		throw 'Missing/improperly formatted header row'
	}

	// Get the headers specificed in the config file
	const headers = headerRow.values
		.filter((value, index) => indices.includes(index))
		.map((column) => column.userEnteredValue?.stringValue || '')
		.map((value) => value.trim())
		.map((value) => value.replace(/\r?\n|\r/g, ''))
	return headers
}

export function isComplete(row) {
	if (!progressIndex) {
		throw 'Error: checking for completeness but no progress index is defined in the config file'
	}
	return row.values[progressIndex].userEnteredValue?.numberValue === 100
}

export function convertSheetRowToApplication(row) {
	// Get the fields specified in the config file
	const responses = indices
		.map((index) => row.values[index]) // Get the value each index (might be undefined)
		.map((column) => column?.userEnteredValue?.stringValue || '') // Get the string in each value
		.map((value) => value.trim()) // Trim the whitespace

	const applicationId = row.values[identifierIndex].userEnteredValue?.stringValue || 'MISSING'

	return { responses, applicationId }
}

export function getAllApps(sheet, offset = 1, onlyComplete = true) {
	try {
		const rowData = sheet.data[0].rowData
		return rowData
			.slice(offset)
			.filter((app) => isComplete(app) || !onlyComplete)
			.map(convertSheetRowToApplication)
	} catch (error) {
		console.error(error)
		throw 'Unable to retrieve the applications'
	}
}

export function createFieldsFromResponses(responses) {
	const questions = getQuestions()
	console.log(responses)
	return questions.map((question, index) => ({
		question,
		response: responses[index]
	}))
}
