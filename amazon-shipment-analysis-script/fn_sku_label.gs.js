const LABEL_CONFIG = {
  // Page dimensions
  WIDTH_POINTS: 180,  // 2.5 inches * 72 points per inch = 180 points
  HEIGHT_POINTS: 72,  // 1 inch * 72 points per inch = 72 points
  
  // Margins (in points)
  MARGIN_TOP: .5,
  MARGIN_BOTTOM: .5,
  MARGIN_LEFT: .5,
  MARGIN_RIGHT: .5,
  
  // Font sizes (adjusted for smaller label)
  BARCODE_FONT_SIZE: 28,        // Reduced from 48 for smaller label
  FNSKU_FONT_SIZE: 10,          // Reduced from 10
  PRODUCT_NAME_FONT_SIZE: 4,    // Reduced from 8
  STATUS_FONT_SIZE: 4,          // Reduced from 8
  
  // Spacing between elements (in points)
  BARCODE_SPACING: -2,           // Space after barcode
  FNSKU_SPACING: 0,             // Reduced from 4
  PRODUCT_NAME_SPACING: 0,      // Reduced from 4
  STATUS_SPACING: 0             // Space after status (bottom element)
};

/**
 * Generates random alphanumeric string of specified length
 * @param {number} length - Length of string to generate
 * @returns {string} Random alphanumeric string
 */
function generateRandomString(length) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates an FNSKU (Fulfillment Network Stock Keeping Unit) for Amazon products
 * @param {string} asin - Amazon Standard Identification Number
 * @param {string} productName - Name of the product
 * @returns {string} Generated FNSKU
 */
function generateFNSKU(asin, productName) {
  try {
    if (!asin || typeof asin !== 'string') {
      throw new Error('Invalid ASIN provided');
    }

    const prefix = 'X' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const middle = generateRandomString(4);
    const suffix = generateRandomString(4);

    return `${prefix}-${middle}-${suffix}`;
  } catch (error) {
    Logger.log(`Error generating FNSKU: ${error.message}`);
    throw error;
  }
}

/**
 * Creates PDF label with barcode FNSKU and regular text
 */
function createPDFLabel(asin, productName, fnsku) {
  try {
    if (!asin || !productName || !fnsku) {
      throw new Error('Missing required parameters for label creation');
    }

    const doc = DocumentApp.create(`FNSKU_${asin}_${new Date().getTime()}`);
    const body = doc.getBody();

    // Set page size
    body.setPageWidth(LABEL_CONFIG.WIDTH_POINTS);
    body.setPageHeight(LABEL_CONFIG.HEIGHT_POINTS);

    // Set margins
    body.setMarginTop(LABEL_CONFIG.MARGIN_TOP);
    body.setMarginBottom(LABEL_CONFIG.MARGIN_BOTTOM);
    body.setMarginLeft(LABEL_CONFIG.MARGIN_LEFT);
    body.setMarginRight(LABEL_CONFIG.MARGIN_RIGHT);

    // FNSKU barcode
    

    // 1. FNSKU barcode
    const barcodeText = encodeToCode128(fnsku);
    body.appendParagraph(barcodeText)
      .setFontSize(LABEL_CONFIG.BARCODE_FONT_SIZE)
      .setSpacingAfter(LABEL_CONFIG.BARCODE_SPACING)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setFontFamily("Libre Barcode 128")

    // 2. FNSKU text in Arial // Append it after the barcode right under it like a subtitle
    body.appendParagraph(fnsku)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setFontFamily("Arial")
      .setFontSize(LABEL_CONFIG.FNSKU_FONT_SIZE)
      .setBold(true)
      .setSpacingAfter(LABEL_CONFIG.FNSKU_SPACING);
  

    // 3. Product name in Arial
    const truncatedName = productName.length > 30 ? 
      productName.substring(0, 27) + '...' : 
      productName;
    
    body.appendParagraph(truncatedName)
      .setAlignment(DocumentApp.HorizontalAlignment.LEFT)
      .setFontFamily("Arial")
      .setFontSize(LABEL_CONFIG.PRODUCT_NAME_FONT_SIZE)
      .setSpacingAfter(4);

    // 4. "New" status in Arial
    body.appendParagraph('New')
      .setAlignment(DocumentApp.HorizontalAlignment.LEFT)
      .setFontFamily("Arial")
      .setFontSize(LABEL_CONFIG.STATUS_FONT_SIZE)
      .setSpacingAfter(0);

    doc.saveAndClose();
    const pdf = doc.getAs('application/pdf');

    // Create or get folder
    let folder;
    try {
      folder = DriveApp.getFoldersByName('Amazon Labels').next();
    } catch (e) {
      folder = DriveApp.createFolder('Amazon Labels');
    }

    // Save PDF and clean up
    const file = folder.createFile(pdf).setName(`${asin}_${fnsku}_${new Date().getTime()}.pdf`);
    DriveApp.getFileById(doc.getId()).setTrashed(true);

    return file.getUrl();
  } catch (error) {
    Logger.log(`Error creating PDF label: ${error.message}`);
    throw error;
  }
}

function processLabels(data) {
  const results = [];
  const errors = [];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty data array provided');
  }

  data.forEach((row, index) => {
    try {
      if (!row.asin || !row.productName) {
        throw new Error(`Missing required fields at index ${index}`);
      }

      const fnsku = generateFNSKU(row.asin, row.productName);
      const pdfUrl = createPDFLabel(row.asin, row.productName, fnsku);
      
      results.push({
        asin: row.asin,
        productName: row.productName,
        fnsku: fnsku,
        pdfUrl: pdfUrl,
        timestamp: new Date()
      });
    } catch (error) {
      errors.push({
        index: index,
        asin: row.asin,
        error: error.message
      });
      Logger.log(`Error processing row ${index}: ${error.message}`);
    }
  });

  // Log results to spreadsheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  results.forEach(result => {
    sheet.appendRow([
      result.asin,
      result.productName,
      result.fnsku,
      result.pdfUrl,
      result.timestamp
    ]);
  });

  return { success: results, errors: errors };
}




function testLabel() {
  const testData = [{
    asin: 'B00TEST123',
    productName: 'Test Product Name That Is Quite Long And Should Be Truncated'
  }];

  try {
    const results = processLabels(testData);
    Logger.log('Test results:', results);
  } catch (error) {
    Logger.log('Test failed:', error.message);
  }
}

function testLabelSize() {
  const testData = [{
    asin: 'B00TEST123',
    productName: 'Test Product Name'
  }];

  try {
    // Process label
    const results = processLabels(testData);
    
    // Get the created file
    const fileId = results.success[0].pdfUrl.split('id=')[1];
    const file = DriveApp.getFileById(fileId);
    
    // Log dimensions
    Logger.log('Label Config:');
    Logger.log(`Expected Width: ${LABEL_CONFIG.WIDTH_POINTS} points (${LABEL_CONFIG.WIDTH_POINTS/72} inches)`);
    Logger.log(`Expected Height: ${LABEL_CONFIG.HEIGHT_POINTS} points (${LABEL_CONFIG.HEIGHT_POINTS/72} inches)`);
    
    return results;
  } catch (error) {
    Logger.log('Test failed:', error.message);
    throw error;
  }
}

