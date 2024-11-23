// File: SheetHelper.gs
function saveToGoogleSheet(csvContent, sheetName) {
  if (!csvContent) {
    throw new Error("No content provided");
  }

  if (!sheetName) {
    throw new Error("Sheet name is required");
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  // Split into rows and properly handle tabs
  const rows = csvContent
    .split('\n')
    .map(line => line.split('\t'))
    .filter(row => row.length > 0 && row[0].trim() !== '');

  if (rows.length === 0) {
    throw new Error("No data found in content");
  }

  // Log the parsing results
  Logger.log(`Processing ${sheetName}:`);
  Logger.log("Number of rows: " + rows.length);
  Logger.log("Number of columns: " + rows[0].length);
  Logger.log("Headers: " + JSON.stringify(rows[0]));

  // Write the data to the sheet
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  // Format the header row
  const headerRange = sheet.getRange(1, 1, 1, rows[0].length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#f3f3f3");

  // Auto-resize columns to fit content
  for (let i = 1; i <= rows[0].length; i++) {
    sheet.autoResizeColumn(i);
  }

  // Add borders to cells
  const dataRange = sheet.getRange(1, 1, rows.length, rows[0].length);
  dataRange.setBorder(true, true, true, true, true, true);

  Logger.log(`Data successfully saved to ${sheetName} sheet!`);
  return {
    rowCount: rows.length,
    columnCount: rows[0].length,
    sheetName: sheetName
  };
}

// Helper function to delete a sheet if it exists
function deleteSheetIfExists(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (sheet) {
    spreadsheet.deleteSheet(sheet);
  }
}

// Helper function to check if a sheet exists
function sheetExists(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName) !== null;
}

// Helper function to get sheet data
function getSheetData(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  return sheet.getDataRange().getValues();
}

/**
 * Appends data to an existing sheet, preserving headers
 * @param {string} csvContent - The TSV/CSV content to append
 * @param {string} sheetName - Name of the sheet to append to
 * @param {string} delimiter - Optional delimiter, defaults to tab (\t)
 * @return {Object} Information about the append operation
 */
function appendToGoogleSheet(csvContent, sheetName, delimiter = '\t') {
  if (!csvContent) {
    throw new Error("No content provided");
  }

  if (!sheetName) {
    throw new Error("Sheet name is required");
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // Split into rows and handle delimiter
  const newRows = csvContent
    .split('\n')
    .map(line => line.split(delimiter))
    .filter(row => row.length > 0 && row[0].trim() !== '');

  if (newRows.length === 0) {
    throw new Error("No data found in content");
  }

  // Get the next empty row
  const nextRow = sheet.getLastRow() + 1;

  // Skip header row from new data (index 0)
  const dataToAppend = newRows.slice(1);

  if (dataToAppend.length > 0 && dataToAppend[0].length > 0) {
    sheet.getRange(nextRow, 1, dataToAppend.length, dataToAppend[0].length)
        .setValues(dataToAppend);
  }

  // Log the results
  Logger.log(`Appending to ${sheetName}:`);
  Logger.log(`Starting at row: ${nextRow}`);
  Logger.log(`Rows appended: ${dataToAppend.length}`);
  Logger.log(`New total rows: ${sheet.getLastRow()}`);

  return {
    startingRow: nextRow,
    rowsAppended: dataToAppend.length,
    totalRows: sheet.getLastRow(),
    sheetName: sheetName
  };
}