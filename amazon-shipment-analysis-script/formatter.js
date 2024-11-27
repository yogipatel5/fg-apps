function formatSheet(sheetName, options = {}) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found`);
    return;
  }
  
  // Default options
  const defaultOptions = {
    headerBackgroundColor: '#f3f3f3',    // Light gray header
    headerFontColor: '#000000',          // Black header text
    headerFontWeight: 'bold',            // Bold header text
    evenRowColor: '#ffffff',             // White for even rows
    oddRowColor: '#f7f7f7',              // Very light gray for odd rows
    borderColor: '#d0d0d0'               // Light gray for borders
  };
  
  // Merge provided options with defaults
  const settings = { ...defaultOptions, ...options };
  
  // Get the data range and values
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const numRows = values.length;
  
  if (numRows <= 1) return; // Only header row exists
  
  // Find last used column by checking all rows
  let lastCol = 0;
  for (let row of values) {
    for (let j = row.length - 1; j >= 0; j--) {
      if (row[j] !== '' && row[j] != null) {
        lastCol = Math.max(lastCol, j + 1);
        break;
      }
    }
  }
  
  // Delete excess columns if they exist
  if (lastCol < sheet.getMaxColumns()) {
    sheet.deleteColumns(lastCol + 1, sheet.getMaxColumns() - lastCol);
  }
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange
    .setBackground(settings.headerBackgroundColor)
    .setFontColor(settings.headerFontColor)
    .setFontWeight(settings.headerFontWeight)
    .setHorizontalAlignment('left')
    .setBorder(true, true, true, true, true, true, 
               settings.borderColor, SpreadsheetApp.BorderStyle.SOLID);
  
  if (numRows > 1) {
    // Format data rows
    const dataRows = sheet.getRange(2, 1, numRows - 1, lastCol);
    
    // Set alignment for all data cells
    dataRows.setHorizontalAlignment('left');
    
    // Set alternating row colors
    for (let i = 2; i <= numRows; i++) {
      const rowRange = sheet.getRange(i, 1, 1, lastCol);
      rowRange.setBackground(i % 2 === 0 ? settings.evenRowColor : settings.oddRowColor);
    }
    
    // Add borders to all data cells
    dataRows.setBorder(true, true, true, true, true, true, 
                      settings.borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, lastCol);
  
  // Check for number columns and right-align them
  const headers = values[0];
  for (let col = 0; col < lastCol; col++) {
    let isNumericColumn = true;
    // Check data rows (skip header)
    for (let row = 1; row < numRows; row++) {
      if (values[row][col] !== '' && values[row][col] != null) {
        // Check if the value is not a number (allow for formatted numbers with commas)
        if (isNaN(values[row][col].toString().replace(/,/g, ''))) {
          isNumericColumn = false;
          break;
        }
      }
    }
    if (isNumericColumn) {
      // Right align numeric columns
      sheet.getRange(2, col + 1, numRows - 1, 1).setHorizontalAlignment('right');
    }
  }
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Remove any existing filters
  let filter = sheet.getFilter();
  if (filter) {
    filter.remove();
  }
  
  // Add new filter
  sheet.getRange(1, 1, numRows, lastCol).createFilter();
}