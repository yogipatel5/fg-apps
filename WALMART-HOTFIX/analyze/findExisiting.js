/**
 * Analyzes missing products and attempts to find matching parent SKUs
 * @returns {Array} Array of analyzed products with potential matches
 */
function findExisting() {
    // Load all necessary data into memory upfront
    const allProducts = getAllWalmartProducts();
    const newSkus = getAllNewSkus(); // Assuming this loads all new SKUs at once

    // Process all products in a single pass
    return allProducts
        .map(product => {
            const result = {
                originalSku: product.SKU,
                itemName: product['Item Name'],
                status: 'No match found',
                matchedParentSku: null,
                error: null
            };

            // Early return if SKU is already in Compiled sheet
            if (newSkus.includes(product.SKU)) {
                result.status = 'New SKU';
                // console.log(`Sku ${product.SKU} is in Compiled sheet, skipping...`);
                return result;
            }



            try {
                const childSkus = extractChildSkus(product);

                if (childSkus.length > 0) {
                    try {
                        const matchedParentSku = getParentSku(childSkus);
                        result.status = 'Match found';
                        result.matchedParentSku = matchedParentSku;
                    } catch (error) {
                        result.status = 'No match found';
                        result.error = error.message;
                    }
                } else {
                    result.status = 'No child SKUs found';
                    result.error = 'Product has no child SKUs to analyze';
                }
            } catch (error) {
                result.status = 'Error';
                result.error = error.message;
            }

            return result;
        })
        .filter(Boolean); // Remove any undefined results
}

/**
 * Extracts child SKUs from a product object and converts old UPCs to new ones
 * @param {Object} product - Product object from getMissingProducts
 * @returns {Array} Array of child SKU objects with { childSku, quantity }
 */
function extractChildSkus(product) {
    try {
        const oldBreakdown = getSkuBreakdown(product.SKU);

        // Process all children in a single map operation
        return oldBreakdown
            .map(child => {
                const newUpc = getSingleUpcInfo(child.childSku);
                return newUpc ? {
                    childSku: newUpc,
                    quantity: child.quantity
                } : null;
            })
            .filter(Boolean); // Remove null entries
    } catch (error) {
        console.error(`Error processing ${product.SKU}:`, error.message);
        throw error;
    }
}

/**
 * Test function for findExisting
 */
function testFindExisting() {
    try {
        const results = findExisting();
        console.log('Analysis Results:');
        console.log(JSON.stringify(results, null, 2));

        // Log summary
        const summary = {
            total: results.length,
            matchesFound: results.filter(r => r.status === 'Match found').length,
            noMatches: results.filter(r => r.status === 'No match found').length,
            errors: results.filter(r => r.status === 'Error').length
        };

        console.log('\nSummary:', summary);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}
