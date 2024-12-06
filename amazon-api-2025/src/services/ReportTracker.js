// File: ReportTracker.gs

// Constants for report tracking
const REPORT_TRACKER = {
  SHEET_NAME: "report_tracker",
  MAX_AGE_HOURS: 24,  // Consider reports newer than this as still valid
  COLUMNS: {
    REPORT_TYPE: 0,
    REPORT_ID: 1,
    REQUESTED_TIME: 2,
    COMPLETED_TIME: 3,
    STATUS: 4,
    DOCUMENT_ID: 5
  }
};

function initializeReportTracker() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(REPORT_TRACKER.SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(REPORT_TRACKER.SHEET_NAME);
    const headers = [
      'Report Type',
      'Report ID',
      'Requested Time',
      'Completed Time',
      'Status',
      'Document ID'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRecentReport(reportType) {
  const sheet = initializeReportTracker();
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  // Skip header row
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    if (row[REPORT_TRACKER.COLUMNS.REPORT_TYPE] === reportType &&
        row[REPORT_TRACKER.COLUMNS.STATUS] === 'DONE') {
      
      const completedTime = new Date(row[REPORT_TRACKER.COLUMNS.COMPLETED_TIME]);
      const ageHours = (now - completedTime) / (1000 * 60 * 60);
      
      if (ageHours < REPORT_TRACKER.MAX_AGE_HOURS) {
        return {
          reportId: row[REPORT_TRACKER.COLUMNS.REPORT_ID],
          documentId: row[REPORT_TRACKER.COLUMNS.DOCUMENT_ID],
          completedTime: completedTime
        };
      }
    }
  }
  return null;
}

function logReportRequest(reportType, reportId) {
  const sheet = initializeReportTracker();
  const now = new Date().toISOString();
  
  const newRow = [
    reportType,
    reportId,
    now,
    '',  // Completed Time
    'PROCESSING',
    ''   // Document ID
  ];
  
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, newRow.length).setValues([newRow]);
  return sheet.getLastRow();
}

function updateReportStatus(rowIndex, status, documentId = null) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPORT_TRACKER.SHEET_NAME);
  if (status === 'DONE') {
    sheet.getRange(rowIndex, REPORT_TRACKER.COLUMNS.COMPLETED_TIME + 1).setValue(new Date().toISOString());
    if (documentId) {
      sheet.getRange(rowIndex, REPORT_TRACKER.COLUMNS.DOCUMENT_ID + 1).setValue(documentId);
    }
  }
  sheet.getRange(rowIndex, REPORT_TRACKER.COLUMNS.STATUS + 1).setValue(status);
}