let pvpvData = null;
let pvpvColumnMap = null;
let parentSkuGroups = null;

/**
 * Loads PVPV_Export sheet data into memory if not already loaded
 * @returns {Object} Object containing data and column mapping
 */
function loadPvpvData() {
    // If data is already loaded, return it
    if (pvpvData && pvpvColumnMap) {
        return { data: pvpvData, columnMap: pvpvColumnMap };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pvpvSheet = ss.getSheetByName('PVPV_Export');

    if (!pvpvSheet) {
        throw new Error('Could not find PVPV_Export sheet');
    }

    const [headers, ...rows] = pvpvSheet.getDataRange().getValues();

    // Create column map for faster lookups
    pvpvColumnMap = headers.reduce((acc, header, index) => {
        acc[header.toString().toLowerCase()] = index;
        return acc;
    }, {});

    // Validate required columns
    const requiredColumns = ['parent_sku', 'child_name', 'child_sku', 'child_quantity'];
    const missingColumns = requiredColumns.filter(col => !(col in pvpvColumnMap));

    if (missingColumns.length > 0) {
        throw new Error(`Required columns not found: ${missingColumns.join(', ')}`);
    }

    pvpvData = rows;
    return { data: pvpvData, columnMap: pvpvColumnMap };
}

/**
 * Gets the breakdown of child SKUs and quantities for a given parent SKU
 * @param {string} parentSku - The parent SKU to look up
 * @returns {Array} Array of objects containing child SKU info and quantities
 */
function getSkuBreakdown(parentSku) {
    const { data, columnMap } = loadPvpvData();

    // Get column indexes
    const parentSkuIdx = columnMap['parent_sku'];
    const childNameIdx = columnMap['child_name'];
    const childSkuIdx = columnMap['child_sku'];
    const quantityIdx = columnMap['child_quantity'];

    // Filter and map in a single pass
    const breakdown = data
        .filter(row => row[parentSkuIdx]?.toString() === parentSku)
        .map(row => ({
            childName: row[childNameIdx],
            childSku: row[childSkuIdx].toString(),
            quantity: row[quantityIdx]
        }));

    return breakdown;
}

/**
 * Test function for getSkuBreakdown
 */
function testSkuBreakdown() {
    const testSku = 'COMBO-SPTY3-HNYBBQ';
    const result = getSkuBreakdown(testSku);

    // Expected data
    const expected = [
        {
            childName: 'OLD - Honey BBQ Seasoning',
            childSku: '813327020770',
            quantity: 1
        },
        {
            childName: 'OLD - Chipotle Seasoning',
            childSku: '811207026720',
            quantity: 1
        },
        {
            childName: 'OLD - Himalayan Salt & Pink Peppercorn',
            childSku: '813327020671',
            quantity: 1
        },
        {
            childName: 'OLD - Pizza Seasoning',
            childSku: '813327020299',
            quantity: 1
        }
    ];

    // Compare result with expected
    console.log('Test Results:');
    console.log('Actual:', JSON.stringify(result, null, 2));
    console.log('Expected:', JSON.stringify(expected, null, 2));
    console.log('Match:', JSON.stringify(result) === JSON.stringify(expected));

    // Verify length
    if (result.length !== expected.length) {
        console.log(`❌ Length mismatch: got ${result.length}, expected ${expected.length}`);
        return;
    }

    // Verify each item
    let allMatch = true;
    result.forEach((item, index) => {
        if (JSON.stringify(item) !== JSON.stringify(expected[index])) {
            console.log(`❌ Mismatch at index ${index}:`);
            console.log('Got:', item);
            console.log('Expected:', expected[index]);
            allMatch = false;
        }
    });

    if (allMatch) {
        console.log('✅ All items match expected data');
        return 'getSkuBreakdown Test Passed';
    }
}

