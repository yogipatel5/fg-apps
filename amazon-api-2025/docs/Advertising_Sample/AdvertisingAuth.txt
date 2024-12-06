// File: AdvertisingAuth.gs

const ADVERTISING_CACHE_KEYS = {
  ACCESS_TOKEN: "ADV_ACCESS_TOKEN",
  TOKEN_EXPIRY: "ADV_TOKEN_EXPIRY"
};

function getAdvertisingAccessToken() {
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get(ADVERTISING_CACHE_KEYS.ACCESS_TOKEN);
  const tokenExpiry = cache.get(ADVERTISING_CACHE_KEYS.TOKEN_EXPIRY);
  
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
    Logger.log("Using cached advertising access token");
    return cachedToken;
  }

  // If not, get a new token
  Logger.log("Getting new advertising access token");
  return refreshAdvertisingAccessToken();
}

function refreshAdvertisingAccessToken() {
  const payload = {
    grant_type: "refresh_token",
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
    refresh_token: CONFIG.advertisingRefreshToken, // We'll need to add this to CONFIG
  };
  
  const options = {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: Object.keys(payload)
      .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(payload[key]))
      .join("&"),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch("https://api.amazon.com/auth/o2/token", options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      const errorText = response.getContentText();
      Logger.log("Token refresh failed: " + errorText);
      throw new Error(`HTTP Error ${responseCode}: ${errorText}`);
    }
    
    const data = JSON.parse(response.getContentText());
    if (!data.access_token) {
      throw new Error("No access token in response: " + JSON.stringify(data));
    }
    
    // Cache the new token
    const cache = CacheService.getScriptCache();
    const expiresIn = data.expires_in || 3600;
    const expiryTime = new Date().getTime() + (expiresIn * 1000);
    const cacheTime = Math.min(21600, expiresIn - 300);
    
    cache.putAll({
      [ADVERTISING_CACHE_KEYS.ACCESS_TOKEN]: data.access_token,
      [ADVERTISING_CACHE_KEYS.TOKEN_EXPIRY]: expiryTime.toString()
    }, cacheTime);
    
    Logger.log("New advertising access token cached with expiry in " + expiresIn + " seconds");
    return data.access_token;
    
  } catch (error) {
    Logger.log("Error refreshing advertising access token: " + error);
    throw error;
  }
}

// Updated getAdvertisingProfiles function
function getAdvertisingProfiles() {
  try {
    const accessToken = getAdvertisingAccessToken();
    Logger.log("Using advertising access token: " + accessToken.substring(0, 10) + "...");

    const endpoint = "https://advertising-api-na.amazon.com/v2/profiles";
    
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Amazon-Advertising-API-ClientId": CONFIG.clientId,
      "Content-Type": "application/json"
    };

    const options = {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    };

    Logger.log("Requesting advertising profiles...");
    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log("Response Code: " + responseCode);
    Logger.log("Response: " + responseText);
    
    if (responseCode !== 200) {
      throw new Error(`HTTP Error ${responseCode}: ${responseText}`);
    }

    return JSON.parse(responseText);
  } catch (error) {
    Logger.log("Error getting advertising profiles: " + error);
    throw error;
  }
}