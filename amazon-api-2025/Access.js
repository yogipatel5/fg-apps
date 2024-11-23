// File: Access.gs

// Cache keys
const CACHE_KEYS = {
  ACCESS_TOKEN: "SP_ACCESS_TOKEN",
  TOKEN_EXPIRY: "SP_TOKEN_EXPIRY"
};

function getAccessToken() {
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get(CACHE_KEYS.ACCESS_TOKEN);
  const tokenExpiry = cache.get(CACHE_KEYS.TOKEN_EXPIRY);
  
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
    Logger.log("Using cached access token");
    return cachedToken;
  }

  // If not, get a new token
  Logger.log("Getting new access token");
  return refreshAccessToken();
}

// Modified refreshAccessToken in Access.gs
function refreshAccessToken() {
  const payload = {
    grant_type: "refresh_token",
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
    refresh_token: CONFIG.refreshToken,
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
    const response = UrlFetchApp.fetch(CONFIG.endpoints.token, options);
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

    // Update refresh token if a new one is provided
    if (data.refresh_token && data.refresh_token !== CONFIG.refreshToken) {
      updateRefreshToken(data.refresh_token);
      Logger.log("New refresh token saved");
    }
    
    // Cache the new access token
    const cache = CacheService.getScriptCache();
    const expiresIn = data.expires_in || 3600;
    const expiryTime = new Date().getTime() + (expiresIn * 1000);
    const cacheTime = Math.min(21600, expiresIn - 300);
    
    cache.putAll({
      [CACHE_KEYS.ACCESS_TOKEN]: data.access_token,
      [CACHE_KEYS.TOKEN_EXPIRY]: expiryTime.toString()
    }, cacheTime);
    
    Logger.log("New access token cached with expiry in " + expiresIn + " seconds");
    return data.access_token;
    
  } catch (error) {
    Logger.log("Error refreshing access token: " + error);
    const cache = CacheService.getScriptCache();
    cache.removeAll([CACHE_KEYS.ACCESS_TOKEN, CACHE_KEYS.TOKEN_EXPIRY]);
    throw error;
  }
}


function clearTokenCache() {
  const cache = CacheService.getScriptCache();
  cache.removeAll([CACHE_KEYS.ACCESS_TOKEN, CACHE_KEYS.TOKEN_EXPIRY]);
  Logger.log("Token cache cleared");
}

// Test functions
function testAccessToken() {
  try {
    const token = getAccessToken();
    Logger.log("Access token obtained successfully");
    Logger.log("Token: " + token.substring(0, 10) + "...");
    return token;
  } catch (error) {
    Logger.log("Error in testAccessToken: " + error);
    throw error;
  }
}

function testTokenRefresh() {
  try {
    clearTokenCache();
    Logger.log("Cache cleared, getting new token...");
    const token = getAccessToken();
    Logger.log("New token obtained successfully");
    return token;
  } catch (error) {
    Logger.log("Error in testTokenRefresh: " + error);
    throw error;
  }
}