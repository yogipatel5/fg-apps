// Configuration for the Amazon SP-API FBA Inventory Planning Report
const FBA_INVENTORY = {
    REPORT_TYPE: "GET_FBA_INVENTORY_PLANNING_DATA",
    SHEET_NAME: "fba_inventory_report",
    MARKETPLACE_ID: "ATVPDKIKX0DER",  // US Marketplace
    API: {
      BASE_URL: "https://sellingpartnerapi-na.amazon.com",
      VERSION: "2021-06-30",
      MAX_RETRIES: 3,
      RETRY_DELAY_MS: 1000
    }
  };
  
  function GET_FBA_INVENTORY_PLANNING_DATA() {
    // Initialize Spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(FBA_INVENTORY.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      Logger.log(`Sheet '${FBA_INVENTORY.SHEET_NAME}' not found, creating new sheet`);
      sheet = ss.insertSheet(FBA_INVENTORY.SHEET_NAME);
    }
  
    // Create report request
    const reportId = createReport_(FBA_INVENTORY.REPORT_TYPE);
    if (!reportId) {
      throw new Error("Failed to create report request");
    }
  
    // Wait for report to be ready (max 5 minutes)
    const maxAttempts = 30; // 30 attempts * 10 seconds = 5 minutes
    let reportDoc = null;
    
    for (let i = 0; i < maxAttempts; i++) {
      reportDoc = getReport_(reportId);
      if (reportDoc) break;
      Utilities.sleep(10000); // Wait 10 seconds before next attempt
    }
  
    if (!reportDoc) {
      throw new Error("Report generation timed out after 5 minutes");
    }
  
    // Parse TSV data
    const rows = Utilities.parseCsv(reportDoc, '\t');
    
    if (rows.length > 0) {
      // Add snapshot-date column to header
      rows[0].unshift('snapshot-date');
      
      // Add today's date to all data rows
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      for (let i = 1; i < rows.length; i++) {
        rows[i].unshift(today);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Write data to sheet
      const numRows = rows.length;
      const numCols = rows[0].length;
      sheet.getRange(1, 1, numRows, numCols).setValues(rows);
      
      // Format header row
      sheet.getRange(1, 1, 1, numCols)
        .setFontWeight('bold')
        .setBackground('#f3f3f3')
        .setWrap(true);
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, numCols);
    }
  
    // Log completion
    Logger.log(`Report updated successfully with ${rows.length} rows`);
  }
  
  function createReport_(reportType) {
    try {
      const secrets = getSecrets();
      const accessToken = getAccessToken(secrets);
      Logger.log("Access token obtained");
      
      const payload = {
        reportType: reportType,
        marketplaceIds: [FBA_INVENTORY.MARKETPLACE_ID]
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
  
      const url = `${FBA_INVENTORY.API.BASE_URL}/reports/${FBA_INVENTORY.API.VERSION}/reports`;
      Logger.log(`Making request to: ${url}`);
      
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      Logger.log(`Response code: ${responseCode}`);
      Logger.log(`Response text: ${responseText}`);
      
      if (responseCode === 200 || responseCode === 202) {
        const responseData = JSON.parse(responseText);
        Logger.log(`Report ID received: ${responseData.reportId}`);
        return responseData.reportId;
      }
      
      throw new Error(`Failed with response code ${responseCode}: ${responseText}`);
    } catch (error) {
      Logger.log(`Error in createReport_: ${error.toString()}`);
      throw error;
    }
  }
  
  function getReport_(reportId) {
    try {
      const secrets = getSecrets();
      const accessToken = getAccessToken(secrets);
      const options = {
        method: "get",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken
        },
        muteHttpExceptions: true
      };
  
      const url = `${FBA_INVENTORY.API.BASE_URL}/reports/${FBA_INVENTORY.API.VERSION}/reports/${reportId}`;
      const response = UrlFetchApp.fetch(url, options);
      
      if (response.getResponseCode() !== 200) {
        throw new Error(`Failed to get report status: ${response.getContentText()}`);
      }
      
      const status = JSON.parse(response.getContentText());
      Logger.log(`Report status: ${status.processingStatus}`);
      
      if (status.processingStatus === "DONE" && status.reportDocumentId) {
        return downloadAndDecompressReport_(status.reportDocumentId);
      }
      
      if (status.processingStatus === "FATAL" || status.processingStatus === "CANCELLED") {
        throw new Error(`Report failed with status: ${status.processingStatus}`);
      }
      
      return null;
    } catch (error) {
      Logger.log(`Error getting report: ${error.toString()}`);
      return null;
    }
  }
  
  function downloadAndDecompressReport_(documentId) {
    const secrets = getSecrets();
    const accessToken = getAccessToken(secrets);
    
    const docUrl = `${FBA_INVENTORY.API.BASE_URL}/reports/${FBA_INVENTORY.API.VERSION}/documents/${documentId}`;
    const docResponse = UrlFetchApp.fetch(docUrl, {
      method: "get",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-amz-access-token": accessToken
      },
      muteHttpExceptions: true
    });
    
    const docData = JSON.parse(docResponse.getContentText());
    const reportResponse = UrlFetchApp.fetch(docData.url);
    const content = reportResponse.getContent();
    
    if (docData.compressionAlgorithm === "GZIP") {
      const blob = Utilities.newBlob(content, 'application/x-gzip');
      return Utilities.ungzip(blob).getDataAsString();
    }
    
    return Utilities.newBlob(content).getDataAsString();
  }
  