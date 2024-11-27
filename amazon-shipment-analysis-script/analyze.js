function analyzeFulfillment() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get data from sheets
  const vendoSheet = ss.getSheetByName('VendoPO');
  const inventorySheet = ss.getSheetByName('Available Inventory');
  const standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
  
  // Create inventory map using UPCs
  const inventoryMap = new Map();
  const inventoryData = inventorySheet.getDataRange().getValues();
  for (let i = 1; i < inventoryData.length; i++) {
    if (inventoryData[i][0] && inventoryData[i][1] && inventoryData[i][2]) {
      const upc = inventoryData[i][1];
      const quantity = parseInt(inventoryData[i][2].toString().replace(/,/g, ''));
      inventoryMap.set(upc, quantity);
    }
  }
  
  // Create standardized breakdown map
  const standardizedMap = new Map();
  const standardizedData = standardizedSheet.getDataRange().getValues();
  for (let i = 1; i < standardizedData.length; i++) {
    const [sku, originalName, standardizedName, upc, quantity, type] = standardizedData[i];
    if (!standardizedMap.has(sku)) {
      standardizedMap.set(sku, {
        components: [],
        type: type
      });
    }
    standardizedMap.get(sku).components.push({
      name: standardizedName,
      upc: upc,
      quantity: parseInt(quantity) || 1
    });
  }
  
  // Create or get summary sheet
  let summarySheet = ss.getSheetByName('Fulfillment Summary');
  if (summarySheet) {
    let filter = summarySheet.getFilter();
    if (filter) {
      filter.remove();
    }
    summarySheet.clear();
  } else {
    summarySheet = ss.insertSheet('Fulfillment Summary');
  }
  
  // Set headers
  const headers = [
    'SKU',
    'Product Name',
    'Type',
    'Requested Qty',
    'Can Fulfill?',
    'Available Qty',
    'Notes'
  ];
  summarySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Analyze each request
  const summaryData = [];
  const vendoData = vendoSheet.getDataRange().getValues();
  
  for (let i = 1; i < vendoData.length; i++) {
    const sku = vendoData[i][2];
    const requestedQty = vendoData[i][3];
    const productName = vendoData[i][1];
    
    if (!requestedQty || requestedQty === 0) continue;
    
    const skuInfo = standardizedMap.get(sku);
    let canFulfill = 'Yes';
    let availableQty = requestedQty;
    let notes = '';
    
    if (skuInfo) {
      // Find limiting component
      let limitingComponent = null;
      let minAvailable = Infinity;
      
      skuInfo.components.forEach(component => {
        const inventoryQty = inventoryMap.get(component.upc) || 0;
        const neededQty = requestedQty * component.quantity;
        const availableForComponent = Math.floor(inventoryQty / component.quantity);
        
        if (availableForComponent < minAvailable) {
          minAvailable = availableForComponent;
          limitingComponent = component;
        }
        
        if (inventoryQty < neededQty) {
          canFulfill = 'No';
        }
      });
      
      availableQty = minAvailable;
      if (canFulfill === 'No' && limitingComponent) {
        notes = `Limited by ${limitingComponent.name}`;
      }
    } else {
      canFulfill = 'No';
      availableQty = 0;
      notes = 'SKU not found in breakdown';
    }
    
    summaryData.push([
      sku,
      productName,
      skuInfo ? skuInfo.type : 'Unknown',
      requestedQty,
      canFulfill,
      availableQty,
      notes
    ]);
  }
  
  // Write summary data
  if (summaryData.length > 0) {
    summarySheet.getRange(2, 1, summaryData.length, headers.length)
      .setValues(summaryData);
  }
  
  // Format sheet
  summarySheet.autoResizeColumns(1, headers.length);
  const headerRange = summarySheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#f3f3f3');
  headerRange.setFontWeight('bold');
  
  // Add filter
  const dataRange = summarySheet.getDataRange();
  dataRange.createFilter();
}