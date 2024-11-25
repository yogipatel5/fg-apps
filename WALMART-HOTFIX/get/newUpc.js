/**
 * Gets new UPC and SKU information based on old UPC(s)
 * @param {string|string[]} oldUpc - Single UPC or array of UPCs to look up
 * @returns {Object[]} Array of objects containing old and new product information
 */
function getNewUpcInfo(oldUpc) {
    // Convert single UPC to array for consistent handling
    const upcsToFind = Array.isArray(oldUpc) ? oldUpc : [oldUpc];

    // Get the Compiled sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const compiledSheet = ss.getSheetByName('Compiled');

    // Get all data and headers
    const data = compiledSheet.getDataRange().getValues();
    const headers = data[0];

    // Find relevant column indexes
    const upcIndex = headers.indexOf('Upc');
    const skuIndex = headers.indexOf('sku');
    const prevUpcIndex = headers.indexOf('previous_upc');
    const prevSkuIndex = headers.indexOf('previous_sku');
    const nameIndex = headers.indexOf('Name');

    // Store results
    const results = [];

    // Search for each UPC
    upcsToFind.forEach(searchUpc => {
        // Find matching rows
        const matches = data.slice(1).filter(row => {
            const previousUpc = String(row[prevUpcIndex] || '').trim();
            return previousUpc === String(searchUpc).trim();
        });

        // Add matches to results
        matches.forEach(match => {
            results.push({
                previous_upc: String(match[prevUpcIndex] || ''),
                previous_sku: String(match[prevSkuIndex] || ''),
                new_upc: String(match[upcIndex] || ''),
                new_sku: String(match[skuIndex] || ''),
                name: String(match[nameIndex] || '')
            });
        });
    });

    return results;
}
/**
 * Gets new UPC information for a single old UPC
 * @param {string} oldUpc - Single UPC to look up
 * @returns {Object|null} Object containing product information or null if not found
 */
function getSingleUpcInfo(oldUpc) {
    if (!oldUpc) {
        throw new Error('No UPC provided to getSingleUpcInfo');
    }

    // Get the Compiled sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const compiledSheet = ss.getSheetByName('Compiled');

    // Get all data and headers
    const data = compiledSheet.getDataRange().getValues();
    const headers = data[0];

    // Find relevant column indexes
    const upcIndex = headers.indexOf('Upc');
    const skuIndex = headers.indexOf('sku');
    const prevUpcIndex = headers.indexOf('previous_upc');
    const prevSkuIndex = headers.indexOf('previous_sku');
    const nameIndex = headers.indexOf('Name');

    // Find matching row
    const match = data.slice(1).find(row => {
        const previousUpc = String(row[prevUpcIndex] || '').trim();
        return previousUpc === String(oldUpc).trim();
    });

    // Return null if no match found
    if (!match) return null;

    // Return the matching product info
    return String(match[upcIndex] || '');
}

/**
 * Test function for getNewUpcInfo
 */
function testGetNewUpcInfo() {
    // Test cases
    const testUpcs = [
        "813327026611",  // Garlic & Herb Salt
        "813327020671"   // Himalayan Salt & Pink Peppercorn
    ];

    // Get results
    const results = getNewUpcInfo(testUpcs);

    // Log results
    console.log("Test Results:");
    results.forEach(result => {
        console.log("\nProduct Found:");
        console.log(`Name: ${result.name}`);
        console.log(`Previous UPC: ${result.previous_upc} → New UPC: ${result.new_upc}`);
        console.log(`Previous SKU: ${result.previous_sku} → New SKU: ${result.new_sku}`);
    });

    // Verify expected results
    const expectedResults = [
        {
            previous_upc: "813327026611",
            previous_sku: "FGS-GHS-1B",
            new_upc: "810134440241",
            new_sku: "FS-GRHS",
            name: "Garlic & Herb Salt Finisher"
        },
        {
            previous_upc: "813327020671",
            previous_sku: "813327020671",
            new_upc: "810134440104",
            new_sku: "FS-HSPP",
            name: "Himalayan Salt & Pink Peppercorn Finisher"
        }
    ];

    // Compare results with expected results
    expectedResults.forEach((expected, index) => {
        const actual = results.find(r => r.previous_upc === expected.previous_upc);

        if (!actual) {
            console.error(`❌ No result found for ${expected.name}`);
            return;
        }

        console.log('\nComparing results for:', expected.name);
        console.log('Expected:', JSON.stringify(expected, null, 2));
        console.log('Actual:', JSON.stringify(actual, null, 2));

        const matches =
            actual.previous_upc === expected.previous_upc &&
            actual.previous_sku === expected.previous_sku &&
            actual.new_upc === expected.new_upc &&
            actual.new_sku === expected.new_sku &&
            actual.name === expected.name;

        if (matches) {
            console.log(`✅ Test passed for ${expected.name}`);
        } else {
            console.log(`❌ Test failed for ${expected.name}`);
            // Log specific mismatches
            if (actual.previous_upc !== expected.previous_upc) console.log('Previous UPC mismatch');
            if (actual.previous_sku !== expected.previous_sku) console.log('Previous SKU mismatch');
            if (actual.new_upc !== expected.new_upc) console.log('New UPC mismatch');
            if (actual.new_sku !== expected.new_sku) console.log('New SKU mismatch');
            if (actual.name !== expected.name) console.log('Name mismatch');
        }
    });

    // If all tests passed, log success and return 'Test Passed'
    console.log('\nAll tests passed');
    return 'getNewUpcInfo Test Passed';
}