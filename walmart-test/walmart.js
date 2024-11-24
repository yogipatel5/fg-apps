
function authenticateWalmart() {
  var authUrl = "https://marketplace.walmartapis.com/v3/token"; // endpoint for getting an access token
  
  // All Access
  // var clientId = "886be6b9-8715-4630-a130-e25543c272b0"; // your Walmart API client ID
  // var clientSecret = "AP4FPi2yR8W5RHveN31Cgo0vFMsmgAli0xQikwP27B0EaE767dstGkDyu6rJu56JvU9hHg0MoK7u1Ek4EQZw1FA"; // your Walmart API client secret

  // ShipStation Access Token
  var clientId = "cd772473-4369-4ea3-b231-e195092383cd"; // your Walmart API client ID
  var clientSecret = "AIq2KLgj3hPMUf6ohHDh7Fqchd4ufMtxNmd5TL5-EtUWad3pJ5GO1zF134JP4CEIkj8mFBf-kw-f12QfS6f0M8k"; // your Walmart API client secret
  
  var payload = {
    "grant_type": "client_credentials"
  };
  
  var options = {
    "method": "get",
    "muteHttpExceptions": true,
    "headers": {
      "Authorization": "Basic " + Utilities.base64Encode(clientId + ":" + clientSecret),
      "contentType": "application/json",
      "Accept": 'application/json',
      "Content-Type": "application/x-www-form-urlencoded",
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": Utilities.getUuid()
    },
    "payload": payload
  };
  // var token_Valid = checkWalmartAuth();
    // if (token_Valid = false) {
      Logger.log ("Attempting to Auth Walmart")
      var response = UrlFetchApp.fetch(authUrl, options);
      
      // Check the HTTP response code to see if the request was successful
      var responseCode = response.getResponseCode();
      if (responseCode === 200) {
        Logger.log ("Walmart Authenticated")
        var accessToken = JSON.parse(response.getContentText())["access_token"];
        // Store the access token in Script Properties
        var scriptProperties = PropertiesService.getScriptProperties();
        scriptProperties.setProperty('WALMART_ACCESS_TOKEN', accessToken);
        return true
      } else {
        // Print the full HTTP response to the console for debugging
        console.log(response.getContentText());
        throw new Error("Failed to authenticate with Walmart API. HTTP response code: " + responseCode);
        return false
      }
    // } else {Logger.log("Token is Valid Already")}
}

function checkWalmartAuth() {
  var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
  var options = {
    "method": "get",
    "muteHttpExceptions": true,
    "headers": {
      "WM_SEC.ACCESS_TOKEN": accessToken,
      "contentType": "application/json",
      "Accept": 'application/json',
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": Utilities.getUuid()
    }
  };

  var authUrl = "https://marketplace.walmartapis.com/v3/token/detail"

  var response = UrlFetchApp.fetch(authUrl, options);
  
  var responseCode = response.getResponseCode();
  
  if (responseCode === 200) {
    var tokenValid = JSON.parse(response.getContentText())["is_valid"]
     if (tokenValid= true) {
       Logger.log("Token is Valid")
     }
     return tokenValid
  } else {
    // Print the full HTTP response to the console for debugging
    return false
    Logger.log(response.getContentText());
  }
}

function prepareWalmartPayload() {
  // Connect to the database
  var conn = getProductConnection();

  // Execute the query to get the data
  var stmt = conn.createStatement();
  var rs = stmt.executeQuery("SELECT walmart_sku as sku, if(inventory_available<10,0,inventory_available) as quantity FROM products_new LEFT JOIN product_identifiers pi on products.upc = pi.upc where walmart_sku is not null");

  // Prepare the payload object
  var payload = {
    "InventoryHeader": {
      "version": "1.4"
    },
    "Inventory": []
  };

  // Loop through the results and add them to the payload
  while (rs.next()) {
    var sku = rs.getString("sku");
    var quantity = rs.getInt("quantity");

    var item = {
      "sku": sku,
      "quantity": {
        "unit": "EACH",
        "amount": quantity
      }
    };

    payload.Inventory.push(item);
  }

  // Close the database connection and return the payload
  rs.close();
  stmt.close();
  conn.close();
  Logger.log(JSON.stringify(payload))
  return JSON.stringify(payload);
}

// Update Walmart Inventory for any Product that has a Walmart Sku assigned in the product_identifiers table
function updateWalmartInventory() {
   // endpoint for getting inventory data
  var accessToken = PropertiesService.getScriptProperties().getProperty('WALMART_ACCESS_TOKEN');
  
  var inventoryUrl = "https://marketplace.walmartapis.com/v3/feeds"
  var params = {
    "feedType" : "inventory",
    "shipNode" : "525361290886127617"
  };

  // Append the query string to the URL
  var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
  inventoryUrl += '?' + queryString;
  
  Logger.log (inventoryUrl);
  var payload = prepareWalmartPayload()

  // Logger.log (accessToken);
  
 // Build the request options with the access token in the headers

  var options = {
    "method": "POST",
    "muteHttpExceptions": true,
    "payload": payload,
    "headers": {
      "WM_SEC.ACCESS_TOKEN": accessToken,
      "contentType": "application/json",
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
    var response = UrlFetchApp.fetch(inventoryUrl, options);
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
