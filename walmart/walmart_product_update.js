 
 // https://developer.walmart.com/api/us/mp/items#operation/getAnItem
function updateProductListing(sku,gtin) {
  var sku = 'FG-BTRCNMNRL'
  var gtin = '609820974029'
  // endpoint for getting inventory data
  
  var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
  var productURL = "https://marketplace.walmartapis.com/v3/items/FG-BTRCNMNRL"
  var params = {
    "feedType" : "MP_MAINTENANCE"
  };

  // Append the query string to the URL
  var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
  productURL += '?' + queryString;
  
  Logger.log (productURL);

  // Logger.log (accessToken);
  
 // Build the request options with the access token in the headers

  var options = {
    "method": "GET",
    "muteHttpExceptions": true,
    "headers": {
      "WM_SEC.ACCESS_TOKEN": accessToken,
      "Accept": 'application/json',
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": Utilities.getUuid()
    }
  };
  
  var token_Valid = checkWalmartAuth();
  if (!token_Valid) {
    authenticateWalmart();
    Utilities.sleep(5000); // wait for 5 seconds before retrying
    var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
  }
    
    var response = UrlFetchApp.fetch(productURL, options);
    var product_info = response.getContentText();
    Logger.log(product_info)
    Logger.log("here")
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("inventory_log");
    var newRow = [new Date(), "Success", product_info];
    sheet.appendRow(newRow);

    var responseCode = response.getResponseCode();
    if (responseCode === 200) {
      Logger.log("Success");
      return true
      
    } else {
      // Print the full HTTP response to the console for debugging
      Logger.log(response.getContentText());
      throw new Error("Failed to authenticate with Walmart API. HTTP response code: " + responseCode);
      return false
    }
}


// https://developer.walmart.com/api/us/mp/items#operation/getAnItem
function getProductListing(sku,gtin) {
  var sku = 'FG-BTRCNMNRL'
  var gtin = '609820974029'
  // endpoint for getting inventory data
  
  var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
  var productURL = "https://marketplace.walmartapis.com/v3/items/FG-BTRCNMNRL"
  var params = {
    "productIdType" : "SKU"
  };

  // Append the query string to the URL
  var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
  productURL += '?' + queryString;
  
  Logger.log (productURL);

  // Logger.log (accessToken);
  
 // Build the request options with the access token in the headers

  var options = {
    "method": "GET",
    "muteHttpExceptions": true,
    "headers": {
      "WM_SEC.ACCESS_TOKEN": accessToken,
      "Accept": 'application/json',
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": Utilities.getUuid()
    }
  };
  
  var token_Valid = checkWalmartAuth();
  if (!token_Valid) {
    authenticateWalmart();
    Utilities.sleep(5000); // wait for 5 seconds before retrying
    var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
  }
    
    var response = UrlFetchApp.fetch(productURL, options);
    var product_info = response.getContentText();
    Logger.log(product_info)
    Logger.log("here")
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("inventory_log");
    var newRow = [new Date(), "Success", product_info];
    sheet.appendRow(newRow);

    var responseCode = response.getResponseCode();
    if (responseCode === 200) {
      Logger.log("Success");
      return true
      
    } else {
      // Print the full HTTP response to the console for debugging
      Logger.log(response.getContentText());
      throw new Error("Failed to authenticate with Walmart API. HTTP response code: " + responseCode);
      return false
    }
}
