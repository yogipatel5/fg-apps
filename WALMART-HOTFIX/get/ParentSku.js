/**
 * Finds the parent SKU that matches a given set of child SKUs and their quantities
 * @param {Array} childSkus - Array of objects containing child SKU info and quantities
 * @returns {string} The matching parent SKU
 */
function getParentSku(childSkus) {
    const { data, columnMap } = loadPvpvData();

    // Initialize parentSkuGroups if not already done
    if (!parentSkuGroups) {
        const parentSkuIdx = columnMap['parent_sku'];
        const childSkuIdx = columnMap['child_sku'];
        const quantityIdx = columnMap['child_quantity'];

        // Group all rows by parent SKU for efficient processing
        parentSkuGroups = data.reduce((acc, row) => {
            const parentSku = row[parentSkuIdx];
            if (!acc.has(parentSku)) {
                acc.set(parentSku, []);
            }
            acc.get(parentSku).push({
                childSku: row[childSkuIdx].toString(),
                quantity: row[quantityIdx]
            });
            return acc;
        }, new Map());
    }

    // Create a map of child SKUs for faster matching
    const targetChildSkuMap = new Map(
        childSkus.map(child => [child.childSku, child.quantity])
    );

    // Find matching parent SKU
    for (const [parentSku, parentChildren] of parentSkuGroups) {
        // Quick length check first
        if (parentChildren.length !== childSkus.length) {
            continue;
        }

        // Check if all children match
        const allMatch = parentChildren.every(child =>
            targetChildSkuMap.get(child.childSku) === child.quantity
        );

        if (allMatch) {
            return parentSku;
        }
    }

    throw new Error('No matching parent SKU found for the given child SKUs');
}

/**
 * Test function for getParentSku
 */
function testParentSku() {
    // Test case matching COMBO-SPTY3-HNYBBQ
    const testChildSkus = [
        { childSku: '813327020770', quantity: 1 }, // Honey BBQ
        { childSku: '811207026720', quantity: 1 }, // Chipotle
        { childSku: '813327020671', quantity: 1 }, // Himalayan Salt
        { childSku: '813327020299', quantity: 1 }  // Pizza Seasoning
    ];

    try {
        const result = getParentSku(testChildSkus);
        console.log('Test Results:');
        console.log('Found Parent SKU:', result);
        console.log('Expected:', 'COMBO-SPTY3-HNYBBQ');
        console.log('Match:', result === 'COMBO-SPTY3-HNYBBQ');

        if (result === 'COMBO-SPTY3-HNYBBQ') {
            console.log('✅ Test passed');
            return 'getParentSku Test Passed';
        } else {
            console.log('❌ Test failed - unexpected parent SKU');
        }
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
    }
}
