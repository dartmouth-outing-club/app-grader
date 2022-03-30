import { sheets_v4 } from 'googleapis'
import fs from 'fs'
import path from 'path'

type Sheet = sheets_v4.Schema$Sheet
const CONFIG_ROUTE = path.join(process.cwd(), 'app-config.json')

const data = fs.readFileSync(CONFIG_ROUTE)
const config = JSON.parse(data.toString())

// Map the letter of the config file to the index of the array
// Note the minus one since the function outputs A = 1
const indices = config.map((value) => letterToColumn(value.column) - 1)

// https://stackoverflow.com/questions/21229180/convert-column-index-into-corresponding-column-letter/21231012#21231012
function letterToColumn(letter) {
	var column = 0,
		length = letter.length
	for (var i = 0; i < length; i++) {
		column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1)
	}
	return column
}

export function getPrompts() {
	return config.map((value) => value.prompt)
}

export function getHeaders(sheet: Sheet) {
	// Get the first row from the rowData
	let headerRow: sheets_v4.Schema$RowData
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

export function getRandomApp(sheet: Sheet) {
	// Get the first row from the rowData
	let row: sheets_v4.Schema$RowData
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
