/**
 * Main entry point to fetch and process FBA fees data
 * @return {Object} Results containing success status and processing info
 */
// First, let's add just the configuration and these two functions:

const FBA_FEES = {
  REPORT_TYPE: "GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA",
  SHEET_NAME: "inventory_fba_fees",
  MARKETPLACE_ID: "ATVPDKIKX0DER",  // US Marketplace
  THROTTLE: {
    MINIMUM_INTERVAL_MS: 4000
  },
  API: {
    BASE_URL: "https://sellingpartnerapi-na.amazon.com",
    VERSION: "2021-06-30",
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000
  }
};

function createFBAFeesReport() {
  try {
    Logger.log("Starting FBA fees report creation process");
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error("Failed to obtain access token");
    }
    
    Logger.log("Successfully obtained access token");

    const endpoint = `${FBA_FEES.API.BASE_URL}/reports/${FBA_FEES.API.VERSION}/reports`;
    
    const payload = {
      reportType: FBA_FEES.REPORT_TYPE,
      marketplaceIds: [FBA_FEES.MARKETPLACE_ID]
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

    Logger.log("Requesting FBA fees report creation...");
    Logger.log("Endpoint: " + endpoint);
    Logger.log("Headers: " + JSON.stringify(headers, null, 2));
    Logger.log("Payload: " + JSON.stringify(payload, null, 2));
    
    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log(`Response Code: ${responseCode}`);
    Logger.log(`Full Response Text: ${responseText}`);
    
    if (responseCode !== 202 && responseCode !== 200) {
      throw new Error(`HTTP Error ${responseCode}: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    Logger.log("Parsed response object: " + JSON.stringify(result, null, 2));
    
    if (!result.reportId) {
      Logger.log("Response structure doesn't contain reportId. Full response: " + JSON.stringify(result, null, 2));
      throw new Error("No reportId found in response");
    }

    Logger.log("Successfully extracted reportId: " + result.reportId);
    return result.reportId;

  } catch (error) {
    Logger.log("Error creating FBA fees report: " + error);
    Logger.log("Error stack: " + error.stack);
    if (error.message) {
      Logger.log("Error message: " + error.message);
    }
    throw error;
  }
}
function testCreateFBAFeesReport() {
  try {
    Logger.log("Starting test of FBA fees report creation");
    const reportId = createFBAFeesReport();
    Logger.log("Successfully created report with ID: " + reportId);
    return reportId;
  } catch (error) {
    Logger.log("Test failed: " + error);
    throw error;
  }
}

/**
 * Polls the SP-API until report is ready or max attempts reached
 * @param {string} reportId The report ID to check
 * @return {Object} Report status object containing reportDocumentId when complete
 */
function waitForFBAFeesReport(reportId) {
  const MAX_ATTEMPTS = 10;
  const POLLING_INTERVAL_MS = 30000; // 30 seconds

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const accessToken = getAccessToken();
      const options = {
        method: "get",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "x-amz-access-token": accessToken
        },
        muteHttpExceptions: true
      };

      const endpoint = `${FBA_FEES.API.BASE_URL}/reports/${FBA_FEES.API.VERSION}/reports/${reportId}`;
      Logger.log(`Checking report status (attempt ${attempt})...`);
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (responseCode !== 200) {
        Logger.log(`Error checking report status (attempt ${attempt}): HTTP ${responseCode} - ${responseText}`);
        Logger.log(`Waiting ${POLLING_INTERVAL_MS / 1000} seconds before next check...`);
        Utilities.sleep(POLLING_INTERVAL_MS);
        continue;
      }

      Logger.log("Response received, parsing report status...");
      const reportStatus = JSON.parse(responseText);
      Logger.log(`Report status response: ${JSON.stringify(reportStatus)}`);

      if (reportStatus.processingStatus === "DONE" && reportStatus.reportDocumentId) {
        Logger.log(`Report ${reportId} is ready after ${attempt} attempts.`);
        Logger.log(`Report status: ${JSON.stringify(reportStatus)}`);
        return { reportDocumentId: reportStatus.reportDocumentId };
      }

      if (reportStatus.processingStatus === "FATAL") {
        Logger.log(`Report ${reportId} failed with status: ${reportStatus.processingStatus}`);
        return { error: `Report ${reportId} failed with status: ${reportStatus.processingStatus}` };
      }

      if (reportStatus.processingStatus === "CANCELLED") {
        Logger.log(`Report ${reportId} was cancelled`);
        return { error: `Report ${reportId} was cancelled` };
      }

      Logger.log(`Report ${reportId} processing status: ${reportStatus.processingStatus} (attempt ${attempt})`);
      Logger.log(`Waiting ${POLLING_INTERVAL_MS / 1000} seconds before next check...`);
      Utilities.sleep(POLLING_INTERVAL_MS);
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
      Logger.log(`Waiting ${POLLING_INTERVAL_MS / 1000} seconds before next check...`);
      Utilities.sleep(POLLING_INTERVAL_MS);
    }
  }

  throw new Error(`Report ${reportId} not completed after ${MAX_ATTEMPTS} attempts`);
}
function testWaitForFBAFeesReport() {
  try {
    Logger.log("Starting test of waiting for FBA fees report");
    const reportId = createFBAFeesReport();
    const reportStatus = waitForFBAFeesReport(reportId);

    if (reportStatus.error) {
      Logger.log("Test failed: " + reportStatus.error);
      throw new Error(reportStatus.error);
    }

    Logger.log("Successfully waited for report with ID: " + reportId);
    Logger.log("Report document ID: " + reportStatus.reportDocumentId);
    return reportStatus.reportDocumentId;
  } catch (error) {
    Logger.log("Test failed: " + error);
    throw error;
  }
}
/**
 * Downloads and decompresses a report document
 * @param {string} documentId The report document ID to download
 * @return {string} The decompressed report content
 */

function downloadAndDecompressFBAFeesReport(documentId) {
  const endpoint = `${FBA_FEES.API.BASE_URL}/reports/${FBA_FEES.API.VERSION}/documents/${documentId}`;
  const headers = {
    "Authorization": `Bearer ${getAccessToken()}`,
    "x-amz-access-token": getAccessToken()
  };

  const options = {
    method: "get",
    headers: headers,
    muteHttpExceptions: true
  };

  Logger.log(`Downloading report document ${documentId}...`);

  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    const responseText = response.getContentText();
    throw new Error(`Error downloading report document ${documentId}: HTTP ${responseCode} - ${responseText}`);
  }

  const reportContent = response.getContentText();
  const decompressedContent = Utilities.ungzip(reportContent);

  Logger.log(`Successfully downloaded and decompressed report document ${documentId}.`);
  return decompressedContent;
}

function testDownloadAndDecompressFBAFeesReport() {
  try {
    Logger.log("Starting test of downloading and decompressing FBA fees report");
    const reportDocumentId = testWaitForFBAFeesReport();
    const reportContent = downloadAndDecompressFBAFeesReport(reportDocumentId);
    Logger.log("Successfully downloaded and decompressed report content.");
    Logger.log("Content length: " + reportContent.length);
    return reportContent;
  } catch (error) {
    Logger.log("Test failed: " + error);
    throw error;
  }
}

/**
 * Processes and saves the FBA fees data to the sheet
 * @param {string} content The TSV content to save
 * @param {boolean} isFirst Whether this is the first chunk of data
 */
function saveFBAFeesData(content, isFirst) {
  // Implementation details to follow
}

/**
 * Test function to verify the FBA fees report process
 */
function testFBAFeesReport() {
  // Implementation details to follow
}

/**
 * Helper function to validate fees data before saving
 * @param {Array<Array<string>>} rows The data rows to validate
 * @return {Object} Validation results with any errors found
 */
function validateFeesData(rows) {
  // Implementation details to follow
}