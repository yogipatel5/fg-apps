 
 function runInventoryUpdate() {
  var successful = false;
  
  // Run updateSQLInventory and log the status
  try {
    successful = updateSQLInventory();
    if (successful) {
      logSuccess("updateSQLInventory");
    } else {
      logError("updateSQLInventory", "Function returned false");
      return;
    }
  } catch (e) {
    logError("updateSQLInventory", e.message);
    return;
  }
  
  // Wait for 5 seconds
  Utilities.sleep(5000);
  
  // Run authenticateWalmart and log the status
  try {
    successful = authenticateWalmart();
    if (successful) {
      logSuccess("authenticateWalmart");
    } else {
      logError("authenticateWalmart", "Function returned false");
      return;
    }
  } catch (e) {
    logError("authenticateWalmart", e.message);
    return;
  }

  // Wait for 5 seconds
  Utilities.sleep(5000);
  
  // Run updateWalmartInventory and log the status
  try {
    successful = updateWalmartInventory();
    if (successful) {
      logSuccess("updateWalmartInventory");
    } else {
      logError("updateWalmartInventory", "Function returned false");
      return;
    }
  } catch (e) {
    logError("updateWalmartInventory", e.message);
    return;
  }
}

function logSuccess(functionName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("inventory_log");
  var newRow = [new Date(), "Success", functionName];
  sheet.appendRow(newRow);
}

function logError(functionName, errorMessage) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("inventory_log");
  var newRow = [new Date(), "Error", functionName, errorMessage];
  sheet.appendRow(newRow);
}