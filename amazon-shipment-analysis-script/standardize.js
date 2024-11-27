function addProductToUPCSheet(productName, upc = '', alias = '') {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const upcSheet = ss.getSheetByName('Seasoning_UPC');
  
  // Get last row
  const lastRow = upcSheet.getLastRow();
  
  // Add new row
  upcSheet.getRange(lastRow + 1, 1, 1, 3).setValues([[productName, upc, alias]]);
  upcSheet.autoResizeColumns(1, 3);
  
  return lastRow + 1;
}

function standardizeBreakdownSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const breakdownSheet = ss.getSheetByName('Breakdown');
  const upcSheet = ss.getSheetByName('Seasoning_UPC');
  
  // Load UPC data and aliases into maps
  const upcData = upcSheet.getDataRange().getValues();
  const upcMap = new Map();
  const upcMapWithSeasoning = new Map();
  const aliasMap = new Map();
  
  // Track new products that need to be added
  const newProducts = new Set();
  
  for (let i = 1; i < upcData.length; i++) {
    const name = upcData[i][0];
    const upc = upcData[i][1];
    const aliases = upcData[i][2] ? upcData[i][2].toString().split(',').map(a => a.trim()) : [];
    
    upcMap.set(name, upc);
    const baseName = name.replace(/ Seasoning| Topper| Rub/g, '').trim();
    upcMapWithSeasoning.set(baseName, upc);
    
    aliases.forEach(alias => {
      if (alias) {
        aliasMap.set(alias.toLowerCase(), {
          name: name,
          upc: upc
        });
      }
    });
  }
  
  function findUPC(name) {
    let matchedName = name;
    let upc = '';
    
    upc = upcMap.get(name);
    if (upc) return { upc, name, found: true };
    
    upc = upcMap.get(name + ' Seasoning');
    if (upc) return { upc, name: name + ' Seasoning', found: true };
    
    const baseName = name.replace(/ Seasoning| Topper| Rub/g, '').trim();
    upc = upcMapWithSeasoning.get(baseName);
    if (upc) {
      for (const [key, value] of upcMap.entries()) {
        if (value === upc) {
          return { upc, name: key, found: true };
        }
      }
    }
    
    const aliasMatch = aliasMap.get(name.toLowerCase());
    if (aliasMatch) {
      return { upc: aliasMatch.upc, name: aliasMatch.name, found: true };
    }
    
    // If product not found, add to new products set
    newProducts.add(name);
    return { upc: '', name, found: false };
  }
  
  // Get or create standardized sheet
  let standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
  if (!standardizedSheet) {
    standardizedSheet = ss.insertSheet('Standardized_Breakdown');
  } else {
    let filter = standardizedSheet.getFilter();
    if (filter) {
      filter.remove();
    }
    standardizedSheet.clear();
  }
  
  // Set headers
  const headers = ['SKU', 'Original Name', 'Standardized Name', 'Product UPC', 'Quantity', 'Type', 'Product Found'];
  standardizedSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Process breakdown data
  const data = breakdownSheet.getDataRange().getValues();
  const standardizedData = [];
  
  for (let i = 1; i < data.length; i++) {
    const sku = data[i][0];
    if (!sku) continue;
    
    if (data[i][2]) {
      const seasonings = data[i][2].toString().split('\n').filter(s => s.trim());
      const type = data[i][4] || 'Single';
      const unitsPerSku = parseInt(data[i][5]) || 1;
      
      const quantity = seasonings.length === 1 ? unitsPerSku : 1;
      
      seasonings.forEach(seasoning => {
        const originalName = seasoning.trim();
        const { upc, name: standardizedName, found } = findUPC(originalName);
        standardizedData.push([
          sku,
          originalName,
          standardizedName,
          upc,
          quantity,
          type,
          found ? 'Yes' : 'No'
        ]);
      });
    }
  }
  
  // Write data
  if (standardizedData.length > 0) {
    standardizedSheet.getRange(2, 1, standardizedData.length, headers.length).setValues(standardizedData);
  }
  
  // Format sheet
  standardizedSheet.autoResizeColumns(1, headers.length);
  const headerRange = standardizedSheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#f3f3f3');
  headerRange.setFontWeight('bold');
  
  // Add new filter
  const dataRange = standardizedSheet.getDataRange();
  dataRange.createFilter();
  
  // Add new products to UPC sheet
  if (newProducts.size > 0) {
    Logger.log('Adding new products to UPC sheet:');
    newProducts.forEach(product => {
      Logger.log(product);
      addProductToUPCSheet(product);
    });
    
    // Create or update missing products sheet
    let missingSheet = ss.getSheetByName('Missing_Products');
    if (!missingSheet) {
      missingSheet = ss.insertSheet('Missing_Products');
    } else {
      missingSheet.clear();
    }
    
    const missingHeaders = ['Product Name', 'UPC', 'Alias'];
    missingSheet.getRange(1, 1, 1, 3).setValues([missingHeaders]);
    
    const missingData = Array.from(newProducts).map(product => [product, '', '']);
    missingSheet.getRange(2, 1, missingData.length, 3).setValues(missingData);
    
    missingSheet.autoResizeColumns(1, 3);
    const missingHeaderRange = missingSheet.getRange(1, 1, 1, 3);
    missingHeaderRange.setBackground('#f3f3f3');
    missingHeaderRange.setFontWeight('bold');
  }
}