function addProductToUPCSheet(productName, upc = '', alias = '') {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const upcSheet = ss.getSheetByName('Seasoning_UPC');
  
  // Get last row
  const lastRow = upcSheet.getLastRow();
  
  // Add new row
  upcSheet.getRange(lastRow + 1, 1, 1, 3).setValues([[productName, upc, alias]]);
  upcSheet.autoResizeColumns(1, 3);
  
  return lastRow + 1;
}