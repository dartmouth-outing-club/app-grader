import fs from 'fs'
import path from 'path'

const CONFIG_ROUTE = path.join(process.cwd(), 'app-config.json')

// Read in the config file on module load
const data = fs.readFileSync(CONFIG_ROUTE)
const config = JSON.parse(data.toString())

// Map the letter of the config file to the index of the array
const indices = config.map((item) => columnLetterToArrayIndex(item.column))

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
export function getPrompts() {
	return config.map((item) => item.prompt)
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

/**
 * Retrieve a single application from the sheet in [{question, answer}] form.
 * The question corresponds to the "question" in the config file;
 * the answer is the answer for that header.
 *
 * @param sheet a single sheet from a Google Sheets V4 API
 * @returns a single set of answers to the application questions
 */
export function getRandomApp(sheet) {
	// Get the first row from the rowData
	let row
	try {
		const rowData = sheet.data[0].rowData
		// Get any random row except for the first one
		row = rowData[Math.floor(Math.random() * (rowData.length - 1)) + 1]
	} catch (error) {
		console.error(error)
		throw 'Unable to get a random application response'
	}

	// Get the fields specified in the config file
	const fields = row.values
		.filter((value, index) => indices.includes(index))
		.map((column) => column.userEnteredValue?.stringValue || '')
		.map((value) => value.trim())
	return fields
}
