// Get new sku informaation from `Compiled` sheet
function isNewSku(sku) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const compiledSheet = ss.getSheetByName('Compiled');

    if (!compiledSheet) {
        throw new Error('Could not find Compiled sheet');
    }

    const data = compiledSheet.getDataRange().getValues();
    const headers = data[0];
    // console.log('Headers:', headers);

    // Find the index of the SKU column
    const skuColumn = headers.findIndex(header => header === 'SKU');
    // console.log('SKU column index:', skuColumn);

    // Find the row that matches the SKU
    const skuRow = data.findIndex(row => row[skuColumn] === sku);
    // console.log('SKU row:', skuRow);

    // Return true if the SKU is found, false otherwise
    return skuRow !== -1;
}

// Get all new SKUs from the Compiled sheet
function getAllNewSkus() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const compiledSheet = ss.getSheetByName('Compiled');

    if (!compiledSheet) {
        throw new Error('Could not find Compiled sheet');
    }

    const data = compiledSheet.getDataRange().getValues();
    const headers = data[0];
    const skuColumn = headers.findIndex(header => header === 'sku');

    return data.slice(1).map(row => row[skuColumn]);
}
