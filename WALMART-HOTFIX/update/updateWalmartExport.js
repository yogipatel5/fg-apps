/**
 * Updates the Walmart export sheet with matched parent SKUs
 * @returns {Object} Summary of updates made
 */
function updateWalmartExport() {
    try {
        console.log('Starting updateWalmartExport...');

        // Get analysis results from findExisting
        const results = findExisting();
        console.log(`Got ${results?.length || 0} results from findExisting`);

        // Get the Walmart export sheet
        const walmartSheet = SpreadsheetApp.getActiveSpreadsheet()
            .getSheetByName('WalmartExport');

        if (!walmartSheet) {
            throw new Error('WalmartExport sheet not found');
        }

        const sheetOps = new SheetOperations(walmartSheet);

        const summary = {
            totalProcessed: results.length,
            updated: 0,
            skipped: 0,
            errors: 0,
            matchFoundCount: 0,
            skuNotFoundCount: 0,
            noMatchedParentSkuCount: 0
        };

        // Process each result
        results.forEach((result) => {
            const rowIndex = sheetOps.findRowIndex('SKU', result.originalSku);

            if (rowIndex === -1) {
                console.log(`SKU not found in sheet: ${result.originalSku}`);
                summary.skuNotFoundCount++;
                summary.skipped++;
                return;
            }

            try {
                // Determine the correct status
                let searchStatus;
                if (result.status === 'Match found') {
                    searchStatus = 'Match found';
                } else if (result.status === 'New SKU') {
                    searchStatus = 'New SKU';
                } else {
                    searchStatus = 'No match found';
                }

                // Determine the corresponding Status value
                let statusValue;
                switch (searchStatus) {
                    case 'No match found':
                        statusValue = 'Create';
                        break;
                    case 'No child SKUs found':
                        statusValue = 'Current';
                        break;
                    case 'New SKU':
                        statusValue = 'Current';
                        break;
                    case 'Match found':
                        statusValue = 'Replace';
                        break;
                    default:
                        statusValue = 'Create';
                }

                const updates = {
                    'search_status': searchStatus,
                    'Status': statusValue
                };

                // Log the status check and update details
                console.log('Update attempt details:');
                console.log(`- SKU: ${result.originalSku}`);
                console.log(`- Row index: ${rowIndex}`);
                console.log(`- Search status: ${searchStatus}`);
                console.log(`- Status value: ${statusValue}`);
                console.log(`- Updates object:`, updates);

                // Handle matched SKUs
                if (searchStatus === 'Match found') {
                    summary.matchFoundCount++;

                    if (result.matchedParentSku) {
                        updates['MATCHED_NEW_SKU'] = result.matchedParentSku;
                    } else {
                        console.log(`No matchedParentSku found for matched SKU: ${result.originalSku}`);
                        summary.noMatchedParentSkuCount++;
                    }
                }

                const updateResult = sheetOps.updateRow(rowIndex, updates);

                // Log the update result
                console.log('Update result:', {
                    sku: result.originalSku,
                    successful: updateResult.successful,
                    failed: updateResult.failed
                });

                if (updateResult.failed.length > 0) {
                    console.error(`Failed to update columns for ${result.originalSku}:`, updateResult.failed);
                    summary.errors++;
                } else if (searchStatus === 'Match found' && result.matchedParentSku) {
                    summary.updated++;
                } else {
                    summary.skipped++;
                }

            } catch (error) {
                console.error(`Error processing SKU ${result.originalSku}:`, error.message);
                summary.errors++;
            }
        });

        console.log('Detailed Update Summary:', JSON.stringify(summary, null, 2));
        return summary;

    } catch (error) {
        console.error('Error in updateWalmartExport:', error.message);
        throw error;
    }
}

/**
 * Test function for updateWalmartExport using mock data
 */
function testUpdateWalmartExport() {
    try {
        // Create a mock spreadsheet for testing
        const mockSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TestSheet');
        if (!mockSheet) {
            throw new Error('Please create a TestSheet tab for testing');
        }

        // Set up test data in the sheet
        const testData = [
            ['SKU', 'MATCHED_NEW_SKU', 'search_status'],
            ['RUBSCMBO-4', '', ''],
            ['SPRGRLCBROS', '', '']
        ];
        mockSheet.getRange(1, 1, testData.length, testData[0].length).setValues(testData);

        // Run the update
        const summary = updateWalmartExport();
        console.log('Test completed successfully');
        console.log('Summary:', summary);

        // Verify results
        const updatedData = mockSheet.getDataRange().getValues();
        console.log('Updated test data:', updatedData);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}
