function exportSheetsToCSV() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const ui = SpreadsheetApp.getUi();
  
  // Create folder with timestamp
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
  const folderName = `${ss.getName()}_Export_${timestamp}`;
  const folder = DriveApp.createFolder(folderName);
  
  // Track exported files
  const exportedFiles = [];
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    // Get sheet data
    const data = sheet.getDataRange().getValues();
    
    // Convert to CSV
    const csv = data.map(row => 
      row.map(cell => {
        // Handle different data types and ensure proper CSV formatting
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'string') {
          // Escape quotes and wrap in quotes if contains comma or quote
          cell = cell.replace(/"/g, '""');
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell}"`;
          }
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    // Create blob and upload to Drive
    const blob = Utilities.newBlob(csv, MimeType.CSV, `${sheetName}.csv`);
    const file = folder.createFile(blob);
    
    exportedFiles.push({
      name: sheetName,
      url: file.getUrl()
    });
  });
  
  // Create index file with links
  let indexContent = 'Exported Files:\n\n';
  exportedFiles.forEach(file => {
    indexContent += `${file.name}: ${file.url}\n`;
  });
  
  const indexBlob = Utilities.newBlob(indexContent, MimeType.PLAIN_TEXT, 'index.txt');
  folder.createFile(indexBlob);
  
  // Show completion dialog with folder link
  const folderUrl = folder.getUrl();
  ui.alert(
    'Export Complete',
    `All sheets have been exported to CSV files.\n\n` +
    `Folder URL: ${folderUrl}\n\n` +
    `Number of files exported: ${exportedFiles.length}`,
    ui.ButtonSet.OK
  );
  
  // Log to console as backup
  Logger.log(`Export complete. Folder URL: ${folderUrl}`);
  exportedFiles.forEach(file => {
    Logger.log(`${file.name}: ${file.url}`);
  });
}

// Helper function to ensure valid CSV data
function escapeCSV(data) {
  if (typeof data === 'string') {
    // If the data contains quotes, commas, or newlines, wrap it in quotes and escape existing quotes
    if (data.includes('"') || data.includes(',') || data.includes('\n')) {
      return '"' + data.replace(/"/g, '""') + '"';
    }
    return data;
  }
  return data;
}