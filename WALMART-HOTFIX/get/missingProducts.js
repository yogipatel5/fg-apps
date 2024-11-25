/**
 * Gets products from WalmartExport sheet that need replacement
 * Loads sheet data into memory once and filters for products where status is 'review'
 * @returns {Array} Array of products that need replacement
 */
function getMissingProducts() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const walmartSheet = ss.getSheetByName('WalmartExport');

    if (!walmartSheet) {
        throw new Error('Could not find WalmartExport sheet');
    }

    // Load all data at once into memory
    const [headers, ...rows] = walmartSheet.getDataRange().getValues();

    // Create column index map for faster lookups
    const columnMap = headers.reduce((acc, header, index) => {
        acc[header.toString().toLowerCase().replace(/\s+/g, '')] = index;
        return acc;
    }, {});

    // Validate required columns exist
    const requiredColumns = ['status', 'replacementstatus'];
    const missingColumns = requiredColumns.filter(col => !(col in columnMap));

    if (missingColumns.length > 0) {
        throw new Error(`Required columns not found: ${missingColumns.join(', ')}`);
    }

    // Convert rows to objects and filter in a single pass
    return rows
        .filter(row => row[columnMap.status]?.toString().toLowerCase() === 'review')
        .map(row => {
            return headers.reduce((obj, header, index) => {
                obj[header] = row[index];
                return obj;
            }, {});
        });
}

// Create a function to get all products from Compiled sheet
function getAllWalmartProducts() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const walmartSheet = ss.getSheetByName('WalmartExport');
    const [headers, ...rows] = walmartSheet.getDataRange().getValues();
    return rows.map(row => headers.reduce((obj, header, index) => {
        obj[header] = row[index];
        return obj;
    }, {}));
}
