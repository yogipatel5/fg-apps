// FBAReport.gs
function createFBAFulfillmentReport() {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain access token");
    }

    const endpoint = "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports";
    
    const payload = {
      reportType: "GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA",
      marketplaceIds: ["ATVPDKIKX0DER"]
    };
    
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "x-amz-access-token": accessToken
    };

    const options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    Logger.log("Requesting FBA inventory report creation...");
    Logger.log("Payload: " + JSON.stringify(payload));
    
    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 202 && responseCode !== 200) {
      throw new Error(`HTTP Error ${responseCode}: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    Logger.log("Report creation response: " + JSON.stringify(result));
    
    return result.reportId;

  } catch (error) {
    Logger.log("Error creating FBA report: " + error);
    throw error;
  }
}

function pollReportCompletion(reportId, rowIndex, maxAttempts = 20) {  // Increased max attempts
  const accessToken = getAccessToken();
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "x-amz-access-token": accessToken
  };
  
  const options = {
    method: "get",
    headers: headers,
    muteHttpExceptions: true
  };

  let attempts = 0;
  
  while (attempts < maxAttempts) {
    Logger.log(`Checking report status - Attempt ${attempts + 1} of ${maxAttempts}`);
    
    const response = UrlFetchApp.fetch(
      `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports/${reportId}`,
      options
    );
    
    const status = JSON.parse(response.getContentText());
    Logger.log(`Current status: ${status.processingStatus}`);
    
    updateReportStatus(rowIndex, status.processingStatus, status.reportDocumentId);
    
    if (status.processingStatus === "DONE") {
      Logger.log("Report processing completed");
      return status;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      Logger.log("Waiting 30 seconds before next check...");
      Utilities.sleep(30000);
    }
  }
  
  updateReportStatus(rowIndex, "TIMEOUT");
  throw new Error("Report generation timed out after " + maxAttempts + " attempts");
}

function fetchAndProcessFBAReport() {
  const REPORT_TYPE = "GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA";
  
  try {
    // Check for recent report
    const recentReport = findRecentReport(REPORT_TYPE);
    let reportId, documentId, rowIndex;
    
    if (recentReport) {
      Logger.log("Found recent report: " + recentReport.reportId);
      reportId = recentReport.reportId;
      documentId = recentReport.documentId;
    } else {
      // Create new report
      Logger.log("Creating new report...");
      const newReportId = createFBAFulfillmentReport();
      reportId = newReportId;
      rowIndex = logReportRequest(REPORT_TYPE, reportId);
      Logger.log(`New report request logged at row ${rowIndex}`);
      
      Logger.log("Waiting for initial report processing...");
      Utilities.sleep(15000);
      
      // Poll for completion
      Logger.log("Starting status polling...");
      const reportStatus = pollReportCompletion(reportId, rowIndex);
      documentId = reportStatus.reportDocumentId;
    }

    // Download and save report
    Logger.log("Downloading report...");
    const reportContent = downloadReport(documentId);
    
    Logger.log("Saving report to sheet...");
    saveToGoogleSheet(reportContent, "inventory_report_fba");
    
    Logger.log("FBA Report successfully processed");
    return reportId;
    
  } catch (error) {
    Logger.log("Error in fetchAndProcessFBAReport: " + error);
    throw error;
  }
}

function downloadReport(documentId) {
  Logger.log(`Fetching document URL for ID: ${documentId}`);
  
  const accessToken = getAccessToken();
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "x-amz-access-token": accessToken
  };
  
  const options = {
    method: "get",
    headers: headers,
    muteHttpExceptions: true
  };

  const documentUrl = `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/documents/${documentId}`;
  Logger.log("Requesting document URL...");
  const documentResponse = UrlFetchApp.fetch(documentUrl, options);
  
  if (documentResponse.getResponseCode() !== 200) {
    throw new Error(`Failed to get document URL: ${documentResponse.getContentText()}`);
  }

  const documentData = JSON.parse(documentResponse.getContentText());
  Logger.log("Got document URL, downloading content...");
  const reportResponse = UrlFetchApp.fetch(documentData.url);
  return reportResponse.getContentText();
}

function runFBAReport() {
  try {
    fetchAndProcessFBAReport();
  } catch (error) {
    Logger.log("Error in runFBAReport: " + error);
    throw error;
  }
}