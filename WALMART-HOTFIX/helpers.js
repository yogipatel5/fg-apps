function findRowByHeaderAndValueOptimized(sheetName, headerName, searchValue) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found.`);
    }

    // Get the range of the first row (header)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headerIndex = headers.indexOf(headerName);
    if (headerIndex === -1) {
        throw new Error(`Header "${headerName}" not found.`);
    }

    // Read only the column to be searched
    const columnValues = sheet.getRange(2, headerIndex + 1, sheet.getLastRow() - 1).getValues().flat();

    // Find the matching row index
    const rowIndex = columnValues.indexOf(searchValue);
    if (rowIndex === -1) {
        throw new Error(`Value "${searchValue}" not found under header "${headerName}".`);
    }

    // Fetch the entire row corresponding to the match
    const matchedRow = sheet.getRange(rowIndex + 2, 1, 1, sheet.getLastColumn()).getValues()[0];
    return matchedRow;
}

function test() {
    return 'test';
}
