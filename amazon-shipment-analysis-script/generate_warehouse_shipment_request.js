function createWarehouseShipmentRequest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get reference to all needed sheets
  const vendoSheet = ss.getSheetByName('VendoPO');
  const fulfillmentSheet = ss.getSheetByName('Fulfillment Summary');
  const warehouseSheet = ss.getSheetByName('Warehouse Shipment Request Sheet');
  const standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
  const breakdownSheet = ss.getSheetByName('Breakdown');
  
  // Clear existing warehouse sheet
  if (warehouseSheet) {
    let filter = warehouseSheet.getFilter();
    if (filter) {
      filter.remove();
    }
    warehouseSheet.clear();
  }
  
  // Create map for product names from Breakdown sheet
  const productNameMap = new Map();
  const breakdownData = breakdownSheet.getDataRange().getValues();
  for (let i = 1; i < breakdownData.length; i++) {
    if (breakdownData[i][0] && breakdownData[i][1]) {  // SKU and Product Name
      productNameMap.set(breakdownData[i][0], breakdownData[i][1]);
    }
  }
  
  // Create maps for ASIN lookup
  const asinMap = new Map();
  const vendoData = vendoSheet.getDataRange().getValues();
  for (let i = 1; i < vendoData.length; i++) {
    if (vendoData[i][0] && vendoData[i][2]) {  // ASIN and SKU
      asinMap.set(vendoData[i][2], vendoData[i][0]);
    }
  }
  
  // Get fulfillable SKUs
  const fulfillmentData = fulfillmentSheet.getDataRange().getValues();
  const fulfillableSKUs = new Map();
  for (let i = 1; i < fulfillmentData.length; i++) {
    if (fulfillmentData[i][4] === 'Yes') {  // Can Fulfill column
      fulfillableSKUs.set(fulfillmentData[i][0], {  // SKU
        type: fulfillmentData[i][2],
        quantity: fulfillmentData[i][3]
      });
    }
  }
  
  // Get standardized breakdown for combo packs
  const standardizedData = standardizedSheet.getDataRange().getValues();
  const breakdownMap = new Map();
  for (let i = 1; i < standardizedData.length; i++) {
    const [sku, originalName, standardizedName, upc, quantity, type] = standardizedData[i];
    if (!breakdownMap.has(sku)) {
      breakdownMap.set(sku, []);
    }
    breakdownMap.get(sku).push({
      name: standardizedName,
      upc: upc,
      quantity: parseInt(quantity) || 1
    });
  }
  
  // Prepare warehouse request data
  const headers = [
    'Product Name',
    'ASIN',
    'Merchant SKU',
    'Type',
    'Seasonings Included',
    'Quantity'
  ];
  
  const requestData = [headers];
  
  // Process each fulfillable SKU
  fulfillableSKUs.forEach((info, sku) => {
    const asin = asinMap.get(sku) || '';
    const productName = productNameMap.get(sku) || 'Unknown Product';
    const components = breakdownMap.get(sku) || [];
    const seasoningsIncluded = components
      .map(c => `${c.name} (${c.quantity})`)
      .join('\n');
    
    requestData.push([
      productName,
      asin,
      sku,
      info.type,
      seasoningsIncluded,
      info.quantity
    ]);
  });
  
  // Write to warehouse sheet
  if (requestData.length > 1) {  // If we have data beyond headers
    warehouseSheet.getRange(1, 1, requestData.length, headers.length)
      .setValues(requestData);
    
    // Format sheet
    warehouseSheet.autoResizeColumns(1, headers.length);
    const headerRange = warehouseSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#f3f3f3');
    headerRange.setFontWeight('bold');
    
    // Add filter
    const dataRange = warehouseSheet.getDataRange();
    dataRange.createFilter();
    
    // Set row heights for seasonings column
    for (let i = 2; i <= requestData.length; i++) {
      const seasoning = requestData[i-1][4];  // Seasonings column
      if (seasoning && seasoning.includes('\n')) {
        const lines = seasoning.split('\n').length;
        warehouseSheet.setRowHeight(i, lines * 15 + 5);  // 15 pixels per line plus padding
      }
    }
  }
  formatSheet("Warehouse Shipment Request Sheet");
}