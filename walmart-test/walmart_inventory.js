// Helper function to store and combine inventory data
function createInventoryMap() {
  return new Map(); // Will store SKU -> inventory data mapping
}

// Initialize or get the inventory sheet with new column
function initializeInventorySheet() {
  Logger.log("Initializing inventory sheet");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Walmart Inventory');
  
  // If sheet exists, clear it but keep headers. If not, create it
  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
    }
    Logger.log("Existing sheet cleared, keeping headers");
  } else {
    sheet = ss.insertSheet('Walmart Inventory');
    Logger.log("New sheet created");
  }
  
  // Set up headers with new Total Inventory column
  var headers = [
    'SKU', 
    'GTIN',
    'Seller Fulfilled Quantity', 
    'Walmart Fulfilled Quantity',
    'Total Inventory',
    'Ship Node',
    'Last Modified',
    'Response Time (ms)',
    'Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setFontWeight('bold')
       .setBackground('#f3f3f3');
       
  return {
    sheet: sheet,
    headers: headers
  };
}

// Progress tracking functions
function initializeProgressTracking(sheet, headerCount) {
  var statsRange = sheet.getRange(1, headerCount + 2, 5, 2);
  statsRange.setValues([
    ['Process Started:', new Date()],
    ['Items Processed:', 0],
    ['Success:', 0],
    ['Errors:', 0],
    ['Last Updated:', new Date()]
  ]);
  
  return statsRange;
}

function updateProgress(statsRange, processed, success, errors) {
  statsRange.setValues([
    [statsRange.getValues()[0][0], statsRange.getValues()[0][1]],  // Keep original start time
    ['Items Processed:', processed],
    ['Success:', success],
    ['Errors:', errors],
    ['Last Updated:', new Date()]
  ]);
}

// Test function
function testBaseSetup() {
  try {
    var inventoryMap = createInventoryMap();
    var { sheet, headers } = initializeInventorySheet();
    var statsRange = initializeProgressTracking(sheet, headers.length);
    
    // Test progress update
    updateProgress(statsRange, 1, 1, 0);
    
    Logger.log("Base setup test completed successfully");
    Logger.log("Sheet created/updated: " + sheet.getName());
    Logger.log("Number of headers: " + headers.length);
    Logger.log("Progress tracking initialized and tested");
    
    return true;
  } catch (e) {
    Logger.log("Error in base setup: " + e.toString());
    return false;
  }
}

////////////////////////////////////

// Fetch seller fulfilled inventory
function fetchWalmartInventory(accessToken, limit, nextCursor) {
  var apiStartTime = new Date().getTime();
  
  var inventoryUrl = "https://marketplace.walmartapis.com/v3/inventories";
  var queryParams = [`limit=${limit}`];
  
  if (nextCursor) {
    queryParams.push(`nextCursor=${nextCursor}`);
  }
  
  var fullUrl = inventoryUrl + '?' + queryParams.join('&');
  Logger.log(`Fetching seller inventory with URL: ${fullUrl}`);
  
  var options = {
    "method": "GET",
    "muteHttpExceptions": true,
    "headers": {
      "WM_SEC.ACCESS_TOKEN": accessToken,
      "Accept": 'application/json',
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": Utilities.getUuid(),
      "WM_CONSUMER.CHANNEL.TYPE": "SWAGGER"
    }
  };
  
  var response = UrlFetchApp.fetch(fullUrl, options);
  var responseTime = new Date().getTime() - apiStartTime;
  
  Logger.log("Seller Response Code: " + response.getResponseCode());
  var responseText = response.getContentText();
  Logger.log("Seller Response Text: " + responseText.substring(0, 500) + "..."); 
  
  return {
    response: response,
    responseText: responseText,
    responseTime: responseTime
  };
}

// Fetch WFS inventory
function fetchWFSInventory(accessToken, limit, offset) {
  var apiStartTime = new Date().getTime();
  
  var inventoryUrl = "https://marketplace.walmartapis.com/v3/fulfillment/inventory";
  var queryParams = [
    `limit=${limit}`,
    `offset=${offset}`
  ];
  
  var fullUrl = inventoryUrl + '?' + queryParams.join('&');
  Logger.log(`Fetching WFS inventory with URL: ${fullUrl}`);
  
  var options = {
    "method": "GET",
    "muteHttpExceptions": true,
    "headers": {
      "WM_SEC.ACCESS_TOKEN": accessToken,
      "Accept": 'application/json',
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": Utilities.getUuid(),
      "WM_CONSUMER.CHANNEL.TYPE": "SWAGGER"
    }
  };
  
  var response = UrlFetchApp.fetch(fullUrl, options);
  var responseTime = new Date().getTime() - apiStartTime;
  
  Logger.log("WFS Response Code: " + response.getResponseCode());
  var responseText = response.getContentText();
  Logger.log("WFS Response Text: " + responseText.substring(0, 500) + "...");
  
  return {
    response: response,
    responseText: responseText,
    responseTime: responseTime
  };
}

// Test fetch functions
function testFetchFunctions() {
  try {
    // Get access token from your existing authentication
    var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
    if (!accessToken) {
      Logger.log("No access token found - please authenticate first");
      return false;
    }
    
    // Test seller fulfilled fetch
    Logger.log("Testing seller fulfilled fetch...");
    var sellerResult = fetchWalmartInventory(accessToken, 1, null);
    Logger.log("Seller fetch status: " + sellerResult.response.getResponseCode());
    
    // Test WFS fetch
    Logger.log("Testing WFS fetch...");
    var wfsResult = fetchWFSInventory(accessToken, 1, 0);
    Logger.log("WFS fetch status: " + wfsResult.response.getResponseCode());
    
    return true;
  } catch (e) {
    Logger.log("Error testing fetch functions: " + e.toString());
    return false;
  }
}


///////////////////////////////////////


// Process WFS inventory item
function processWFSInventoryItem(item, inventoryMap, responseTime) {
  Logger.log(`Processing WFS item: ${JSON.stringify(item)}`);
  
  var walmartFulfilled = 0;
  
  if (item.shipNodes && item.shipNodes.length > 0) {
    item.shipNodes.forEach(function(node) {
      if (node.shipNodeType === 'WFSFulfilled') {
        walmartFulfilled += parseInt(node.availToSellQty) || 0;
        Logger.log(`WFS quantity for ${item.sku}: ${node.availToSellQty}`);
      }
    });
  }
  
  var result = {
    sku: item.sku || '',
    gtin: '',
    sellerFulfilled: 0,
    walmartFulfilled: walmartFulfilled,
    totalInventory: walmartFulfilled,
    shipNode: "525361290886127617",
    modifiedDate: item.shipNodes?.[0]?.modifiedDate || new Date().toISOString(),
    responseTime: responseTime,
    status: 'WFS'
  };
  
  inventoryMap.set(result.sku, result);
  Logger.log(`Stored WFS item in map: ${JSON.stringify(result)}`);
  return result;
}

// Process seller fulfilled inventory item
function processInventoryItem(item, inventoryMap, responseTime) {
  Logger.log(`Processing seller fulfilled item: ${JSON.stringify(item)}`);
  
  var sellerFulfilled = 0;
  var shipNodes = [];
  
  if (item && item.nodes && item.nodes.length > 0) {
    item.nodes.forEach(function(node) {
      if (node.shipNode) {
        shipNodes.push(node.shipNode);
      }
      
      if (node.availToSellQty && node.availToSellQty.unit === 'EACH') {
        sellerFulfilled += parseInt(node.availToSellQty.amount) || 0;
        Logger.log(`Added availToSellQty for ${item.sku} at ${node.shipNode}: ${node.availToSellQty.amount}`);
      }
    });
  }
  
  // Check if SKU exists in WFS inventory
  var existingItem = inventoryMap.get(item.sku);
  if (existingItem) {
    Logger.log(`Found existing WFS inventory for ${item.sku}: ${JSON.stringify(existingItem)}`);
    existingItem.sellerFulfilled = sellerFulfilled;
    existingItem.totalInventory = existingItem.sellerFulfilled + existingItem.walmartFulfilled;
    existingItem.shipNode += `, ${shipNodes.join(', ')}`;
    existingItem.responseTime = responseTime;
    existingItem.status = 'Combined WFS+Seller';
    inventoryMap.set(item.sku, existingItem);
    Logger.log(`Updated combined inventory: ${JSON.stringify(existingItem)}`);
  } else {
    var result = {
      sku: item.sku || '',
      gtin: item.gtin || '',
      sellerFulfilled: sellerFulfilled,
      walmartFulfilled: 0,
      totalInventory: sellerFulfilled,
      shipNode: shipNodes.join(', '),
      modifiedDate: new Date().toISOString(),
      responseTime: responseTime,
      status: 'Seller'
    };
    inventoryMap.set(result.sku, result);
    Logger.log(`Stored seller fulfilled item in map: ${JSON.stringify(result)}`);
  }
}

// Write single item to sheet
function writeInventoryToSheet(item, sheet, currentRow, headers) {
  sheet.getRange(currentRow, 1, 1, headers.length).setValues([[
    item.sku,
    item.gtin,
    item.sellerFulfilled,
    item.walmartFulfilled,
    item.totalInventory,
    item.shipNode,
    item.modifiedDate,
    item.responseTime,
    item.status
  ]]);
}

// Test processing functions
function testProcessing() {
  try {
    var inventoryMap = createInventoryMap();
    var { sheet, headers } = initializeInventorySheet();
    var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
    
    // Test WFS processing
    Logger.log("Testing WFS processing...");
    var wfsResult = fetchWFSInventory(accessToken, 1, 0);
    if (wfsResult.response.getResponseCode() === 200) {
      var wfsData = JSON.parse(wfsResult.responseText);
      if (wfsData?.payload?.inventory?.[0]) {
        processWFSInventoryItem(wfsData.payload.inventory[0], inventoryMap, wfsResult.responseTime);
      }
    }
    
    // Test seller fulfilled processing
    Logger.log("Testing seller fulfilled processing...");
    var sellerResult = fetchWalmartInventory(accessToken, 1, null);
    if (sellerResult.response.getResponseCode() === 200) {
      var sellerData = JSON.parse(sellerResult.responseText);
      if (sellerData?.elements?.inventories?.[0]) {
        processInventoryItem(sellerData.elements.inventories[0], inventoryMap, sellerResult.responseTime);
      }
    }
    
    // Test writing to sheet
    Logger.log("Testing sheet writing...");
    var currentRow = 2;
    inventoryMap.forEach(function(item) {
      writeInventoryToSheet(item, sheet, currentRow++, headers);
    });
    
    Logger.log("Processing test completed");
    return true;
  } catch (e) {
    Logger.log("Error in processing test: " + e.toString());
    return false;
  }
}


// Main function to pull all inventory
function pullWalmartInventory() {
  Logger.log("Starting Walmart full inventory pull process");
  
  try {
    // Check/refresh authentication using your working functions
    var token_Valid = checkWalmartAuth();
    if (!token_Valid) {
      authenticateWalmart();
      Utilities.sleep(5000); // wait for 5 seconds before retrying
    }
    
    var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
    var { sheet, headers } = initializeInventorySheet();
    var statsRange = initializeProgressTracking(sheet, headers.length);
    var inventoryMap = createInventoryMap();
    var successCount = 0;
    var errorCount = 0;
    
    // First get WFS inventory
    Logger.log("Fetching WFS inventory...");
    var wfsLimit = "300"; // Maximum allowed
    var wfsOffset = "0";
    var hasMore = true;
    
    while (hasMore) {
      var { response, responseText, responseTime } = fetchWFSInventory(accessToken, wfsLimit, wfsOffset);
      
      if (response.getResponseCode() === 200) {
        var wfsData = JSON.parse(responseText);
        
        if (wfsData?.payload?.inventory && wfsData.payload.inventory.length > 0) {
          wfsData.payload.inventory.forEach(function(item) {
            processWFSInventoryItem(item, inventoryMap, responseTime);
            successCount++;
          });
          
          wfsOffset = (parseInt(wfsOffset) + wfsData.payload.inventory.length).toString();
          hasMore = wfsData.headers?.totalCount > parseInt(wfsOffset);
          
          updateProgress(statsRange, successCount + errorCount, successCount, errorCount);
          
          if (hasMore) {
            Logger.log(`Moving to next WFS page. Offset: ${wfsOffset}`);
            Utilities.sleep(1000);
          }
        } else {
          hasMore = false;
        }
      } else {
        Logger.log(`WFS API error: ${responseText}`);
        errorCount++;
        hasMore = false;
      }
    }
    
    // Then get seller fulfilled inventory
    Logger.log("Fetching seller fulfilled inventory...");
    var limit = 50;
    var nextCursor = null;
    hasMore = true;
    
    while (hasMore) {
      var { response, responseText, responseTime } = fetchWalmartInventory(accessToken, limit, nextCursor);
      
      if (response.getResponseCode() === 200) {
        var responseData = JSON.parse(responseText);
        
        if (responseData?.elements?.inventories) {
          responseData.elements.inventories.forEach(function(item) {
            processInventoryItem(item, inventoryMap, responseTime);
            successCount++;
          });
          
          nextCursor = responseData.meta?.nextCursor;
          hasMore = nextCursor != null;
          
          updateProgress(statsRange, successCount + errorCount, successCount, errorCount);
          
          if (hasMore) {
            Logger.log(`Moving to next seller fulfilled page. Items processed: ${successCount}`);
            Utilities.sleep(1000);
          }
        } else {
          hasMore = false;
        }
      } else {
        Logger.log(`Seller fulfilled API error: ${responseText}`);
        errorCount++;
        hasMore = false;
      }
    }
    
    // Write combined results to sheet
    Logger.log("Writing combined results to sheet...");
    var currentRow = 2;
    inventoryMap.forEach(function(item) {
      writeInventoryToSheet(item, sheet, currentRow++, headers);
    });
    
    // Final formatting and updates
    sheet.autoResizeColumns(1, headers.length);
    updateProgress(statsRange, successCount + errorCount, successCount, errorCount);
    Logger.log(`Process completed. Total Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (e) {
    Logger.log(`Main process error: ${e.toString()}`);
    // Don't rethrow - let the process complete even with errors
  }
}