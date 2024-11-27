function createInstructionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let instructionsSheet = ss.getSheetByName('Instructions');
  
  if (instructionsSheet) {
    let filter = instructionsSheet.getFilter();
    if (filter) {
      filter.remove();
    }
    instructionsSheet.clear();
  } else {
    instructionsSheet = ss.insertSheet('Instructions');
  }
  
  const instructions = [
    ['Amazon Shipment Process Instructions', ''],
    ['', ''],
    ['Initial Setup:', ''],
    ['1. Input Data in Required Tabs:', ''],
    ['   • VendoPO tab - Verify or update requested quantities', ''],
    ['   • Available Inventory tab - Verify or update current inventory levels', ''],
    ['', ''],
    ['Step-by-Step Process:', ''],
    ['STEP 1 - Breakdown Analysis', ''],
    ['   • Click "Inventory Tools" menu', ''],
    ['   • Select "1. Breakdown Combo to Individual"', ''],
    ['   • Review the generated "Inventory Breakdown" sheet:', ''],
    ['     ✓ Verify product identification', ''],
    ['     ✓ Check single and bundle quantities', ''],
    ['     ✓ Confirm available inventory numbers', ''],
    ['', ''],
    ['STEP 2 - Fulfillment Analysis', ''],
    ['   • Click "Inventory Tools" menu', ''],
    ['   • Select "2. Analyze Fulfillment Capability"', ''],
    ['   • Review the generated "Fulfillment Summary" sheet:', ''],
    ['     ✓ Check which SKUs can be fulfilled', ''],
    ['     ✓ Note any inventory limitations', ''],
    ['     ✓ Verify available quantities', ''],
    ['', ''],
    ['STEP 3 - Generate Warehouse Request', ''],
    ['   • Click "Inventory Tools" menu', ''],
    ['   • Select "3. Create Warehouse Shipment Request"', ''],
    ['   • Review the generated "Warehouse Shipment Request Sheet":', ''],
    ['     ✓ Confirm only fulfillable items are listed', ''],
    ['     ✓ Verify product names and quantities', ''],
    ['     ✓ Check combo pack component breakdowns', ''],
    ['', ''],
    ['Optional - Export to CSV:', ''],
    ['   • Click "Inventory Tools" menu', ''],
    ['   • Select "Export All Sheets to CSV"', ''],
    ['   • Access exported files in the created Google Drive folder', ''],
    ['', ''],
    ['⚠️ Important Notes:', ''],
    ['• Verify results after each step before proceeding', ''],
    ['• If you find errors, fix source data and restart from Step 1', ''],
    ['• Steps must be followed in order: 1 ➜ 2 ➜ 3', ''],
    ['• Save your work regularly', '']
  ];
  
  // Write instructions
  instructionsSheet.getRange(1, 1, instructions.length, 2).setValues(instructions);
  
  // Format sheet
  instructionsSheet.setColumnWidth(1, 600);
  instructionsSheet.setColumnWidth(2, 100);
  
  // Format title
  const titleRange = instructionsSheet.getRange('A1');
  titleRange
    .setFontSize(16)
    .setFontWeight('bold')
    .setBackground('#4285f4')  // Google Blue
    .setFontColor('#ffffff');  // White text
  
  // Format main section headers
  const mainHeaders = [
    {range: 'A3', color: '#e8eaf6'},  // Light Indigo
    {range: 'A8', color: '#e8eaf6'}   // Light Indigo
  ];
  
  mainHeaders.forEach(header => {
    instructionsSheet.getRange(header.range)
      .setFontWeight('bold')
      .setBackground(header.color)
      .setFontSize(12);
  });
  
  // Format step headers
  const stepHeaders = [
    {range: 'A9', color: '#4285f4'},   // Step 1 - Blue
    {range: 'A16', color: '#0f9d58'},  // Step 2 - Green
    {range: 'A23', color: '#db4437'},  // Step 3 - Red
  ];
  
  stepHeaders.forEach(header => {
    instructionsSheet.getRange(header.range)
      .setFontWeight('bold')
      .setFontColor('#ffffff')
      .setBackground(header.color)
      .setFontSize(12);
  });
  
  // Format checkmarks and bullet points
  const checkRanges = instructionsSheet.getDataRange().getValues();
  for (let i = 0; i < checkRanges.length; i++) {
    if (checkRanges[i][0].trim().startsWith('✓')) {
      instructionsSheet.getRange(i + 1, 1)
        .setFontColor('#0f9d58');  // Green checkmarks
    }
  }
  
  // Format Important Notes section
  const notesRange = instructionsSheet.getRange('A35');
  notesRange
    .setBackground('#fff3e0')  // Light Orange
    .setFontWeight('bold')
    .setFontSize(12);
  
  // Add borders
  const fullRange = instructionsSheet.getRange(1, 1, instructions.length, 2);
  fullRange.setBorder(true, true, true, true, false, false, 
                     '#d0d0d0', SpreadsheetApp.BorderStyle.SOLID);
  
  // Make links clickable
 const tabRanges = [
    {row: 5, text: 'VendoPO'},
    {row: 6, text: 'Available Inventory'}
  ];
  
  tabRanges.forEach(tab => {
    const cell = instructionsSheet.getRange(`A${tab.row}`);
    const cellValue = cell.getValue();
    const tabText = tab.text;
    
    // Make the tab name bold and blue
    const richText = SpreadsheetApp.newRichTextValue()
      .setText(cellValue)
      .setTextStyle(0, cellValue.length, SpreadsheetApp.newTextStyle()
        .setBold(true)
        .setForegroundColor('#1a73e8')  // Google Blue
        .build())
      .build();
    
    cell.setRichTextValue(richText);
  });
  // Freeze the title row
  instructionsSheet.setFrozenRows(1);
  
  // Auto-resize rows
  instructionsSheet.autoResizeRows(1, instructions.length);
}