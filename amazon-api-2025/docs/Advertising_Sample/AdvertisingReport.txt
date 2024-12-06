// File: AdvertisingReport.gs

function createAdvertisingReport() {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain access token");
    }

    // Using the Advertising API endpoint
    const endpoint = "https://advertising-api.amazon.com/v2/sp/campaigns/report";
    
    // Get date range for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const payload = {
      reportDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      metrics: ["impressions", "clicks", "cost", "attributedSales30d", "attributedUnitsOrdered30d"],
      campaignType: "sponsoredProducts"
    };
    
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Amazon-Advertising-API-ClientId": CONFIG.clientId,
      "Amazon-Advertising-API-Scope": CONFIG.profileId, // We'll need to add this to CONFIG
      "Content-Type": "application/json"
    };

    const options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    Logger.log("Requesting Advertising report creation...");
    Logger.log("Payload: " + JSON.stringify(payload));
    
    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log("Full response: " + responseText);
    
    if (responseCode !== 202 && responseCode !== 200) {
      throw new Error(`HTTP Error ${responseCode}: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    Logger.log("Report creation response: " + JSON.stringify(result));
    
    return result.reportId;

  } catch (error) {
    Logger.log("Error creating Advertising report: " + error);
    throw error;
  }
}

// First, let's add a function to get the advertising profile ID
function getAdvertisingProfiles() {
  try {
    const accessToken = getAccessToken();
    const endpoint = "https://advertising-api.amazon.com/v2/profiles";
    
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

    const response = UrlFetchApp.fetch(endpoint, options);
    Logger.log("Profiles response: " + response.getContentText());
    
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error getting advertising profiles: " + error);
    throw error;
  }
}

// Function to get campaign metrics for a date range
function getCampaignMetrics(startDate, endDate) {
  try {
    const accessToken = getAccessToken();
    const endpoint = "https://advertising-api.amazon.com/v2/sp/campaigns/report/metrics";
    
    const payload = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: ["impressions", "clicks", "cost", "attributedSales30d"],
      campaignType: "sponsoredProducts"
    };

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Amazon-Advertising-API-ClientId": CONFIG.clientId,
      "Amazon-Advertising-API-Scope": CONFIG.profileId,
      "Content-Type": "application/json"
    };

    const options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(endpoint, options);
    Logger.log("Metrics response: " + response.getContentText());
    
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error getting campaign metrics: " + error);
    throw error;
  }
}

// Function to process and save daily spend data
function processAndSaveDailySpend(data) {
  const SHEET_NAME = "advertising_daily_spend";
  
  // Convert the data into rows with date and spend
  const rows = [["Date", "Impressions", "Clicks", "Spend", "Sales"]];
  
  Object.entries(data).forEach(([date, metrics]) => {
    rows.push([
      date,
      metrics.impressions || 0,
      metrics.clicks || 0,
      metrics.cost ? parseFloat(metrics.cost) : 0,
      metrics.attributedSales30d ? parseFloat(metrics.attributedSales30d) : 0
    ]);
  });

  saveToGoogleSheet(rows, SHEET_NAME);
}

// Main function to run advertising report
function runDailySpendReport() {
  try {
    // Get the last 30 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    // Get the metrics
    const metrics = getCampaignMetrics(startDate, endDate);
    
    // Process and save the data
    processAndSaveDailySpend(metrics);
    
    Logger.log("Daily spend report completed successfully");
  } catch (error) {
    Logger.log("Error running daily spend report: " + error);
    throw error;
  }
}

function setupAdvertising() {
  const profiles = getAdvertisingProfiles();
  Logger.log("Available profiles: " + JSON.stringify(profiles));
}

function getCampaignMetrics(startDate, endDate) {
  try {
    const accessToken = getAccessToken();
    const profileId = getAdvertisingProfileId();
    
    const endpoint = "https://advertising-api-na.amazon.com/v2/sp/campaigns/report/metrics";
    
    const payload = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: ["impressions", "clicks", "cost", "attributedSales30d"],
      campaignType: "sponsoredProducts"
    };

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Amazon-Advertising-API-ClientId": CONFIG.clientId,
      "Amazon-Advertising-API-Scope": profileId,
      "Content-Type": "application/json"
    };

    Logger.log("Headers being sent: " + JSON.stringify(headers, null, 2));
    Logger.log("Payload being sent: " + JSON.stringify(payload, null, 2));

    const options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

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
    Logger.log("Error getting campaign metrics: " + error);
    throw error;
  }
}

function initialAdvertisingSetup() {
  Logger.log("Step 1: Getting profiles");
  const profileId = setupAdvertising();
  
  Logger.log("Step 2: Testing access");
  testAdvertisingAccess();
  
  Logger.log("Setup complete");
  return profileId;
}