// File: SecretsManager.gs

function saveSecrets() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  const secrets = {
    APP_ID: CONFIG.appId,
    CLIENT_ID: CONFIG.clientId,
    CLIENT_SECRET: CONFIG.clientSecret,
    REFRESH_TOKEN: CONFIG.refreshToken,
    TOKEN_ENDPOINT: CONFIG.endpoints.token,
    REPORTS_ENDPOINT: CONFIG.endpoints.reports,
    LAST_UPDATED: new Date().toISOString()
  };

  try {
    scriptProperties.setProperties(secrets);
    Logger.log("Secrets successfully saved to Script Properties");
    Logger.log("Last updated: " + secrets.LAST_UPDATED);
    return true;
  } catch (error) {
    Logger.log("Error saving secrets: " + error);
    throw error;
  }
}

function getSecrets() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const properties = scriptProperties.getProperties();
  
  if (!properties.APP_ID || !properties.CLIENT_ID || !properties.CLIENT_SECRET || !properties.REFRESH_TOKEN) {
    throw new Error("Missing required secrets. Please run saveSecrets() first.");
  }

  return {
    appId: properties.APP_ID,
    clientId: properties.CLIENT_ID,
    clientSecret: properties.CLIENT_SECRET,
    refreshToken: properties.REFRESH_TOKEN,
    endpoints: {
      token: properties.TOKEN_ENDPOINT,
      reports: properties.REPORTS_ENDPOINT
    },
    lastUpdated: properties.LAST_UPDATED
  };
}

function updateRefreshToken(newRefreshToken) {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  try {
    scriptProperties.setProperty('REFRESH_TOKEN', newRefreshToken);
    scriptProperties.setProperty('LAST_UPDATED', new Date().toISOString());
    Logger.log("Refresh token updated successfully");
    return true;
  } catch (error) {
    Logger.log("Error updating refresh token: " + error);
    throw error;
  }
}

function clearSecrets() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  try {
    scriptProperties.deleteAllProperties();
    Logger.log("All secrets cleared successfully");
    return true;
  } catch (error) {
    Logger.log("Error clearing secrets: " + error);
    throw error;
  }
}

// Function to verify secrets are properly stored
function verifySecrets() {
  try {
    const secrets = getSecrets();
    Logger.log("Secrets verification:");
    Logger.log("- App ID exists: " + !!secrets.appId);
    Logger.log("- Client ID exists: " + !!secrets.clientId);
    Logger.log("- Client Secret exists: " + !!secrets.clientSecret);
    Logger.log("- Refresh Token exists: " + !!secrets.refreshToken);
    Logger.log("- Last Updated: " + secrets.lastUpdated);
    return true;
  } catch (error) {
    Logger.log("Secrets verification failed: " + error);
    return false;
  }
}

// Function to display secrets in a redacted format
function displayRedactedSecrets() {
  const secrets = getSecrets();
  
  const redactString = (str, showChars = 4) => {
    if (!str) return 'null';
    return str.substring(0, showChars) + '...' + str.substring(str.length - showChars);
  };

  Logger.log("Current Secrets (Redacted):");
  Logger.log("App ID: " + redactString(secrets.appId));
  Logger.log("Client ID: " + redactString(secrets.clientId));
  Logger.log("Client Secret: " + redactString(secrets.clientSecret));
  Logger.log("Refresh Token: " + redactString(secrets.refreshToken));
  Logger.log("Last Updated: " + secrets.lastUpdated);
}