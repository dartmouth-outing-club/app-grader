import { APP_CONFIG } from '../modules/config.js'

// Map the letter of the APP_CONFIG file to the index of the array
const indices = APP_CONFIG.questions.map((item) => columnLetterToArrayIndex(item.column))
const identifierIndex = columnLetterToArrayIndex(APP_CONFIG.identifierColumn)
const progressIndex = APP_CONFIG.progressColumn
	? columnLetterToArrayIndex(APP_CONFIG.progressColumn)
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

/** Get the the application questions from the APP_CONFIG file */
function getQuestions() {
	return APP_CONFIG.questions.map((item) => item.prompt)
}

/**
 * Get the headers from the sheet, based on the columns in the APP_CONFIG file.
 * We're not using this right now, since the headers on the sheet could be something like "Question 1",
 * hence the APP_CONFIG file, but I already wrote it so...
 *
 * @param sheet a single sheet from a Google Sheets V4 API
 * @returns the first row (headers) of the columns denoted in the APP_CONFIG file
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

	// Get the headers specificed in the APP_CONFIG file
	const headers = headerRow.values
		.filter((value, index) => indices.includes(index))
		.map((column) => column.userEnteredValue?.stringValue || '')
		.map((value) => value.trim())
		.map((value) => value.replace(/\r?\n|\r/g, ''))
	return headers
}

export function isComplete(row) {
	if (!progressIndex) {
		throw 'Error: checking for completeness but no progress index is defined in the APP_CONFIG file'
	}
	return row.values[progressIndex].userEnteredValue?.numberValue === 100
}

export function convertSheetRowToApplication(row) {
	// Get the fields specified in the APP_CONFIG file
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
	return questions.map((question, index) => ({
		question,
		response: responses[index]
	}))
}
