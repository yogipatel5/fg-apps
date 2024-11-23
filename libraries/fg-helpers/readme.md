# FlavorGod Helpers Library

This Google Apps Script library provides various helper functions for working with Google Sheets, script properties, and database connectivity for FlavorGod's systems.

## Script Properties Helper (@script_properties.js)

### Functions

#### getAllScriptProperties()
Gets and logs all script properties, with special handling for database credentials.

- Returns formatted list of all script properties
- Prioritizes database-related properties
- Handles errors with detailed logging
- Useful for managing database and other configuration properties

## Sheet Helpers (@sheet_helpers.js)

### Functions

#### addDataToSheetRow(sheetName, row, data)
Adds data to a specific row in a sheet.
- Parameters:
  - sheetName: Name of target sheet
  - row: Row number to add data
  - data: 2D array of values to add

#### addArrayToSheetColumn(sheet, column, values) 
Adds an array of values to a specific column.
- Parameters:
  - sheet: Sheet object
  - column: Target column
  - values: Array of values to add

#### getSheetData(sheetName)
Gets all data from a sheet, removing empty rows.
- Returns cleaned 2D array of sheet values

#### array_2d_remove_empty_array(arr2d)
Helper function to remove empty rows from 2D arrays.

#### addrowtoSheet(sheetName, newArray)
Adds a new row of data to the end of a sheet.
- Parameters:
  - sheetName: Target sheet name
  - newArray: 2D array with row data

#### addDataToSheet(sheetName, newArray)
Alternative method to add data to end of sheet.
- Similar to addrowtoSheet but with different implementation

## Usage Examples
