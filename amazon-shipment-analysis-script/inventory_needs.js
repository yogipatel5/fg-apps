function breakdownInventoryNeeds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get all required sheets
  const vendoSheet = ss.getSheetByName('VendoPO');
  const standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
  const inventorySheet = ss.getSheetByName('Available Inventory');

  const totalNeedsSingle = new Map();  // Will use UPC as key
  const totalNeedsBundle = new Map();  // Will use UPC as key
  const inventoryMap = new Map();      // Will use UPC as key
  const nameToUPC = new Map();         // For converting names to UPCs
  const upcToName = new Map();         // For converting UPCs back to display names

  // Get all product names and UPCS from `Seasoning_UPC` Sheet.
  const seasoningSheet = ss.getSheetByName('Seasoning_UPC');
  const seasoningData = seasoningSheet.getDataRange().getValues();
  // Find the index of the UPC column and the name column
  const upcColumnIndex = seasoningData[0].indexOf('UPC');
  const nameColumnIndex = seasoningData[0].indexOf('Name');

  for (let i = 1; i < seasoningData.length; i++) {
    const name = seasoningData[i][nameColumnIndex];
    const upc = seasoningData[i][upcColumnIndex];
    nameToUPC.set(name, upc);
    upcToName.set(upc, name);
  }

  // Load available inventory with UPC keys
  const inventoryData = inventorySheet.getDataRange().getValues();
  for (let i = 1; i < inventoryData.length; i++) {
    if (inventoryData[i][0] && inventoryData[i][1] && inventoryData[i][2]) {
      const upc = inventoryData[i][1];
      const quantity = parseInt(inventoryData[i][2].toString().replace(/,/g, ''));

      inventoryMap.set(upc, quantity);
    }
  }

  // Load standardized breakdown data
  const standardizedData = standardizedSheet.getDataRange().getValues();
  const standardizedMap = new Map();

  // Skip header row
  for (let i = 1; i < standardizedData.length; i++) {
    const [sku, originalName, standardizedName, upc, quantity, type] = standardizedData[i];
    if (!standardizedMap.has(sku)) {
      standardizedMap.set(sku, {
        type: type,
        components: []
      });
    }
    standardizedMap.get(sku).components.push({
      name: standardizedName,
      upc: upc,
      quantity: parseInt(quantity) || 1
    });
  }

  // Process VendoPO data
  const vendoData = vendoSheet.getDataRange().getValues();
  for (let i = 1; i < vendoData.length; i++) {
    const sku = vendoData[i][2];
    const requestedQty = vendoData[i][3];

    if (!requestedQty || requestedQty === 0) continue;

    const skuInfo = standardizedMap.get(sku);
    if (skuInfo) {
      if (skuInfo.type === 'Single') {
        // For single items, add to single needs
        const component = skuInfo.components[0];
        const currentSingle = totalNeedsSingle.get(component.upc) || 0;
        totalNeedsSingle.set(component.upc, currentSingle + (requestedQty * component.quantity));
      } else if (skuInfo.type === 'Combo') {
        // For combo packs, add to bundle needs
        skuInfo.components.forEach(component => {
          const currentBundle = totalNeedsBundle.get(component.upc) || 0;
          totalNeedsBundle.set(component.upc, currentBundle + (requestedQty * component.quantity));
        });
      }
    }
  }

  // Create or get breakdown summary sheet
  let breakdownSummarySheet = ss.getSheetByName('Inventory Breakdown');
  if (breakdownSummarySheet) {
    let filter = breakdownSummarySheet.getFilter();
    if (filter) {
      filter.remove();
    }
    breakdownSummarySheet.clear();
  } else {
    breakdownSummarySheet = ss.insertSheet('Inventory Breakdown');
  }

  // Prepare summary data with UPC column
  const summaryData = [['Item', 'UPC', 'Total Needed for Single', 'Total Needed for Bundle', 'Available', 'Shortfall', 'Can Fulfill?']];

  // Combine all UPCs from both maps
  const allUPCs = new Set([...totalNeedsSingle.keys(), ...totalNeedsBundle.keys()]);

  allUPCs.forEach(upc => {
    const singleNeed = totalNeedsSingle.get(upc) || 0;
    const bundleNeed = totalNeedsBundle.get(upc) || 0;
    const totalNeed = singleNeed + bundleNeed;
    const available = inventoryMap.get(upc) || 0;
    const shortfall = available - totalNeed;

    summaryData.push([
      upcToName.get(upc) || 'Unknown Product',
      upc,
      singleNeed,
      bundleNeed,
      available,
      shortfall,
      shortfall >= 0 ? 'Yes' : 'No'
    ]);
  });

  // Write and format summary
  breakdownSummarySheet.getRange(1, 1, summaryData.length, 7).setValues(summaryData);
  breakdownSummarySheet.autoResizeColumns(1, 7);

  const headerRange = breakdownSummarySheet.getRange('A1:G1');
  headerRange.setBackground('#f3f3f3');
  headerRange.setFontWeight('bold');

  // Add filter
  const dataRange = breakdownSummarySheet.getDataRange();
  dataRange.createFilter();
}