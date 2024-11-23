// File: Config.gs

const CONFIG = (() => {
  try {
    const secrets = getSecrets();
    return {
      ...secrets,
      advertisingRefreshToken: "YOUR_ADVERTISING_REFRESH_TOKEN", // You'll need to get this from Amazon
      advertisingApi: {
        endpoint: "https://advertising-api-na.amazon.com",
        tokenEndpoint: "https://api.amazon.com/auth/o2/token"
      }
    };
  } catch (error) {
    Logger.log("Error loading secrets from Script Properties. Using fallback values.");
    return {
      // ... existing fallback values ...
      advertisingRefreshToken: "", // Add this
      advertisingApi: {
        endpoint: "https://advertising-api-na.amazon.com",
        tokenEndpoint: "https://api.amazon.com/auth/o2/token"
      }
    };
  }
})();

function testFullSetup() {
  // Test token management
  testAccessToken();
  
  // Test report tracking
  initializeReportTracker();
  
  Logger.log("Setup test completed successfully");
}


function saveAdvertisingCredentials() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('ADVERTISING_REFRESH_TOKEN', 'your_token_here');
  Logger.log("Advertising credentials saved");
}

function saveMyAdvertisingCreds() {
  const credentials = {
    clientId: "your_advertising_client_id",
    clientSecret: "your_advertising_client_secret",
    refreshToken: "your_advertising_refresh_token",
    profileId: "your_profile_id"  // You might get this after first auth
  };
  
  saveAdvertisingCredentials(credentials);
}

function testAdvertisingSetup() {
  const token = getAdvertisingAccessToken();
  Logger.log("Got advertising token");
  
  const profiles = getAdvertisingProfiles();
  Logger.log("Got profiles: " + JSON.stringify(profiles));
}