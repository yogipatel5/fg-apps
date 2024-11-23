// Configuration for the Amazon SP-API Order History Report functionality
const ORDER_HISTORY = {
  REPORT_TYPE: "GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL",
  SHEET_NAME: "order_history",
  MARKETPLACE_ID: "ATVPDKIKX0DER",  // US Marketplace
  MAX_DAYS_PER_REQUEST: 15,         // Amazon's limit per request
  TOTAL_HISTORY_DAYS: 45,          // Increased to cover 45 days total
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

/**
 * Main entry point to fetch and process order history
 * @return {Object} Results containing success status and processing counts
 */
function runOrderHistory() {
  const results = {
    success: false,
    reportsCreated: 0,
    reportsProcessed: 0,
    errors: []
  };

  try {
    Logger.log("Starting Order History process");
    const dateRanges = calculateDateRanges();
    Logger.log(`Created ${dateRanges.length} date ranges for processing`);

    for (const dateRange of dateRanges) {
      try {
        Logger.log(`Processing date range - Start: ${dateRange.startDate}, End: ${dateRange.endDate}`);
        Logger.log(`Applying rate limit sleep: ${ORDER_HISTORY.THROTTLE.MINIMUM_INTERVAL_MS}ms`);
        Utilities.sleep(ORDER_HISTORY.THROTTLE.MINIMUM_INTERVAL_MS);

        Logger.log("Creating report...");
        const reportId = createReport(dateRange);
        Logger.log(`Report creation successful - Report ID: ${reportId}`);
        results.reportsCreated++;
        Logger.log(`Created report ${reportId} for range ${dateRange.startDate} to ${dateRange.endDate}`);

        Logger.log(`Waiting for report ${reportId} to complete processing...`);
        const reportStatus = waitForReport(reportId);
        Logger.log(`Report status received: ${JSON.stringify(reportStatus)}`);
        
        if (reportStatus.reportDocumentId) {
          Logger.log(`Found reportDocumentId: ${reportStatus.reportDocumentId}`);
          Logger.log("Starting download and decompress process...");
          const reportData = downloadAndDecompressReport(reportStatus.reportDocumentId);
          
          if (reportData) {
            Logger.log(`Report data received, length: ${reportData.length} characters`);
            Logger.log("Saving report data to sheet...");
            saveReportData(reportData, results.reportsProcessed === 0);
            results.reportsProcessed++;
            Logger.log(`Successfully processed report ${reportId}`);
          } else {
            Logger.log("WARNING: Report data was null or empty");
          }
        } else {
          Logger.log(`WARNING: No reportDocumentId found in status: ${JSON.stringify(reportStatus)}`);
        }
      } catch (error) {
        const errorMsg = `Error processing date range ${dateRange.startDate} to ${dateRange.endDate}: ${error.message}`;
        Logger.log(`ERROR DETAILS - Message: ${error.message}`);
        Logger.log(`ERROR DETAILS - Stack: ${error.stack}`);
        Logger.log(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    results.success = results.reportsProcessed > 0;
    Logger.log(`Order History process completed. Processed ${results.reportsProcessed} of ${dateRanges.length} reports`);
    
  } catch (error) {
    const errorMsg = `Fatal error in runOrderHistory: ${error.message}`;
    Logger.log(errorMsg);
    results.errors.push(errorMsg);
  }

  return results;
}

/**
 * Polls the SP-API until report is ready or max attempts reached
 * @param {string} reportId The report ID to check
 * @return {Object} Report status object containing reportDocumentId when complete
 */
function waitForReport(reportId) {
  const maxAttempts = 10;
  const pollingInterval = 30000;  // 30 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const accessToken = getAccessToken();
      const options = {
        method: "get",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken
        },
        muteHttpExceptions: true
      };

      const url = `${ORDER_HISTORY.API.BASE_URL}/reports/${ORDER_HISTORY.API.VERSION}/reports/${reportId}`;
      const response = UrlFetchApp.fetch(url, options);
      
      if (response.getResponseCode() !== 200) {
        throw new Error(`Failed to get report status: ${response.getContentText()}`);
      }
      
      const status = JSON.parse(response.getContentText());
      Logger.log(`Report status check ${attempt}: ${status.processingStatus}`);
      
      if (status.processingStatus === "DONE" && status.reportDocumentId) {
        return status;
      }
      
      if (status.processingStatus === "FATAL" || status.processingStatus === "CANCELLED") {
        throw new Error(`Report failed with status: ${status.processingStatus}`);
      }
      
      Logger.log(`Waiting ${pollingInterval/1000} seconds before next check...`);
      Utilities.sleep(pollingInterval);
      
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      Utilities.sleep(pollingInterval);
    }
  }
  
  throw new Error(`Report ${reportId} not completed after ${maxAttempts} attempts`);
}

/**
 * Calculates date ranges based on configuration settings
 * @return {Array<Object>} Array of date range objects with startDate and endDate
 */
function calculateDateRanges() {
  const ranges = [];
  const endDate = new Date();
  let currentStartDate = new Date();
  currentStartDate.setDate(endDate.getDate() - ORDER_HISTORY.TOTAL_HISTORY_DAYS);

  while (currentStartDate < endDate) {
    let chunkEndDate = new Date(currentStartDate);
    chunkEndDate.setDate(chunkEndDate.getDate() + ORDER_HISTORY.MAX_DAYS_PER_REQUEST);
    
    if (chunkEndDate > endDate) {
      chunkEndDate = endDate;
    }

    ranges.push({
      startDate: currentStartDate.toISOString(),
      endDate: chunkEndDate.toISOString()
    });

    currentStartDate = new Date(chunkEndDate);
    currentStartDate.setDate(currentStartDate.getDate() + 1);
  }

  return ranges;
}

/**
 * Creates a new report request with SP-API
 * @param {Object} dateRange Object containing startDate and endDate
 * @return {string} The created report ID
 */
function createReport(dateRange) {
  const accessToken = getAccessToken();
  
  const payload = {
    reportType: ORDER_HISTORY.REPORT_TYPE,
    marketplaceIds: [ORDER_HISTORY.MARKETPLACE_ID],
    dataStartTime: dateRange.startDate,
    dataEndTime: dateRange.endDate
  };

  const options = {
    method: "post",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "x-amz-access-token": accessToken,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const url = `${ORDER_HISTORY.API.BASE_URL}/reports/${ORDER_HISTORY.API.VERSION}/reports`;
  
  for (let attempt = 1; attempt <= ORDER_HISTORY.API.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode === 200 || responseCode === 202) {
        return JSON.parse(response.getContentText()).reportId;
      }
      
      if (attempt < ORDER_HISTORY.API.MAX_RETRIES) {
        Utilities.sleep(ORDER_HISTORY.API.RETRY_DELAY_MS * attempt);
      }
    } catch (error) {
      if (attempt === ORDER_HISTORY.API.MAX_RETRIES) throw error;
      Utilities.sleep(ORDER_HISTORY.API.RETRY_DELAY_MS * attempt);
    }
  }
  
  throw new Error("Failed to create report after all retry attempts");
}

/**
 * Downloads and decompresses a report document
 * @param {string} documentId The report document ID to download
 * @return {string} The decompressed report content
 */
function downloadAndDecompressReport(documentId) {
  try {
    Logger.log("Starting download process...");
    const accessToken = getAccessToken();
    
    const docUrl = `${ORDER_HISTORY.API.BASE_URL}/reports/${ORDER_HISTORY.API.VERSION}/documents/${documentId}`;
    Logger.log(`Fetching document metadata from: ${docUrl}`);
    const docResponse = UrlFetchApp.fetch(docUrl, {
      method: "get",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    
    const docData = JSON.parse(docResponse.getContentText());
    Logger.log(`Document metadata: ${JSON.stringify(docData)}`);
    
    Logger.log(`Downloading report from URL: ${docData.url}`);
    const reportResponse = UrlFetchApp.fetch(docData.url);
    
    Logger.log(`Report download response code: ${reportResponse.getResponseCode()}`);
    const content = reportResponse.getContent();
    Logger.log(`Downloaded content size: ${content.length} bytes`);
    
    Logger.log("Creating blob and decompressing with GZIP...");
    const blob = Utilities.newBlob(content, 'application/x-gzip');
    const decompressedContent = Utilities.ungzip(blob).getDataAsString();
    Logger.log(`Successfully decompressed content, size: ${decompressedContent.length} characters`);
    
    return decompressedContent;
    
  } catch (error) {
    Logger.log(`Error in download process: ${error.toString()}`);
    Logger.log(`Error name: ${error.name}`);
    Logger.log(`Error message: ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Saves report data to Google Sheet
 * @param {string} content The TSV content to save
 * @param {boolean} isFirst Whether this is the first chunk of data
 */
function saveReportData(content, isFirst) {
  if (!content) throw new Error("No content provided to save");

  const rows = content.split('\n')
    .filter(line => line.trim())
    .map(line => line.split('\t'));
    
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_HISTORY.SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(ORDER_HISTORY.SHEET_NAME);
  }

  if (isFirst) sheet.clear();

  if (rows.length > 0 && rows[0].length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  }
}

/**
 * Test function to run the order history process
 */
function testOrderHistory() {
  const results = runOrderHistory();
  Logger.log(`Process completed with ${results.reportsProcessed} reports processed`);
  if (results.errors.length > 0) {
    Logger.log("Errors encountered:", results.errors);
  }
}