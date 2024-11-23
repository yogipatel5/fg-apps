/**
 * Gets the earliest date from the order_history sheet
 * @return {Date} The earliest date found in the sheet
 */
function getEarliestOrderDate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_HISTORY.SHEET_NAME);
  if (!sheet) {
    throw new Error("Order history sheet not found");
  }

  // Get the purchase-date column index
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const purchaseDateIndex = headers.findIndex(header => header === 'purchase-date') + 1; // Convert to 1-based index
  if (purchaseDateIndex === 0) {
    throw new Error("purchase-date column not found in sheet");
  }

  Logger.log(`Found purchase-date column at index ${purchaseDateIndex}`);

  // Get the purchase-date column values
  const range = sheet.getRange(2, purchaseDateIndex, sheet.getLastRow() - 1, 1);
  const dates = range.getValues()
    .flat() // Flatten the 2D array to 1D
    .filter(date => date) // Filter out empty values
    .map(date => new Date(date)); // Convert to Date objects

  if (dates.length === 0) {
    throw new Error("No valid dates found in purchase-date column");
  }

  // Find the earliest date
  const earliestDate = dates.reduce((minDate, currentDate) =>
    currentDate < minDate ? currentDate : minDate
  );

  Logger.log(`Earliest date found: ${earliestDate.toISOString()}`);
  return earliestDate;
}

/**
 * Calculates the date range for the next 15-day historical pull
 * @return {Object} Object containing startDate and endDate
 */
function calculateNextDateRange() {
  const earliestDate = getEarliestOrderDate();
  
  // Set endDate to the earliest date we currently have
  const endDate = new Date(earliestDate);
  
  // Set startDate to 15 days before that
  const startDate = new Date(earliestDate);
  startDate.setDate(startDate.getDate() - ORDER_HISTORY.MAX_DAYS_PER_REQUEST);
  
  Logger.log(`Calculated next date range:
    Start: ${startDate.toISOString()}
    End: ${endDate.toISOString()}`);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

/**
 * Runs order history pull for the next 15-day period
 * @return {Object} Results of the order history pull
 */
function runNextOrderHistoryPull() {
  try {
    Logger.log("Starting next order history pull");
    
    const dateRange = calculateNextDateRange();
    Logger.log(`Using date range: ${JSON.stringify(dateRange)}`);
    
    const reportId = createReport(dateRange);
    Logger.log(`Created report with ID: ${reportId}`);
    
    const reportStatus = waitForReport(reportId);
    if (reportStatus.reportDocumentId) {
      Logger.log(`Report ready with document ID: ${reportStatus.reportDocumentId}`);
      const reportContent = downloadAndDecompressReport(reportStatus.reportDocumentId);
      
      // Use the new append helper function
      const appendResult = appendToGoogleSheet(reportContent, ORDER_HISTORY.SHEET_NAME);
      Logger.log(`Append operation results: ${JSON.stringify(appendResult)}`);
      
      return {
        success: true,
        dateRange: dateRange,
        reportId: reportId,
        appendResult: appendResult
      };
    }
    
    throw new Error("Report processing failed");
    
  } catch (error) {
    Logger.log(`Error in runNextOrderHistoryPull: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
/**
 * Continuously pulls historical order data in 15-day chunks
 * @param {number} maxPulls - Optional maximum number of pulls (default 10 for safety)
 * @param {number} delayBetweenPulls - Optional delay in ms between pulls (default 10000)
 * @return {Object} Summary of all pulls
 */
function pullHistoricalOrders(maxPulls = 10, delayBetweenPulls = 10000) {
  const summary = {
    totalPulls: 0,
    successfulPulls: 0,
    totalOrdersAppended: 0,
    startDate: null,
    endDate: null,
    errors: [],
    stopped: false,
    stopReason: ''
  };

  try {
    for (let pullCount = 0; pullCount < maxPulls; pullCount++) {
      Logger.log(`\n=== Starting pull ${pullCount + 1} of maximum ${maxPulls} ===`);
      
      // Add delay between pulls (except first one)
      if (pullCount > 0) {
        Logger.log(`Waiting ${delayBetweenPulls/1000} seconds before next pull...`);
        Utilities.sleep(delayBetweenPulls);
      }

      const result = runNextOrderHistoryPull();
      summary.totalPulls++;

      if (result.success) {
        summary.successfulPulls++;
        summary.totalOrdersAppended += result.appendResult.rowsAppended;
        
        // Track date range
        if (!summary.startDate || new Date(result.dateRange.startDate) < new Date(summary.startDate)) {
          summary.startDate = result.dateRange.startDate;
        }
        if (!summary.endDate || new Date(result.dateRange.endDate) > new Date(summary.endDate)) {
          summary.endDate = result.dateRange.endDate;
        }

        // If no new orders were appended, stop pulling
        if (result.appendResult.rowsAppended === 0) {
          summary.stopped = true;
          summary.stopReason = 'No new orders found in last pull';
          break;
        }

        Logger.log(`Successfully pulled ${result.appendResult.rowsAppended} orders for date range: ` +
                  `${result.dateRange.startDate} to ${result.dateRange.endDate}`);

      } else {
        summary.errors.push({
          pullNumber: pullCount + 1,
          error: result.error
        });
        summary.stopped = true;
        summary.stopReason = `Error occurred: ${result.error}`;
        break;
      }
    }

    if (!summary.stopped) {
      summary.stopped = true;
      summary.stopReason = `Reached maximum pulls (${maxPulls})`;
    }

  } catch (error) {
    summary.errors.push({
      pullNumber: summary.totalPulls + 1,
      error: error.message
    });
    summary.stopped = true;
    summary.stopReason = `Fatal error: ${error.message}`;
  }

  Logger.log('\n=== Historical Order Pull Summary ===');
  Logger.log(JSON.stringify(summary, null, 2));
  
  return summary;
}

/**
 * Wrapper function to run historical order pull with default settings
 */
function runHistoricalPull() {
  return pullHistoricalOrders(10, 10000); // 10 pulls maximum, 10 second delay between pulls
}