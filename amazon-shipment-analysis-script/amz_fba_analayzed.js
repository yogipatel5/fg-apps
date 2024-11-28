function processAmazonFBAInventory() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get analyzed FBA report data
    const analyzedSheet = ss.getSheetByName('amz_fba_report_analyzed');
    const analyzedData = analyzedSheet.getDataRange().getValues();
    const headers = analyzedData[0];

    // Find column indices
    const priorityIndex = headers.indexOf('Priority');
    const skuIndex = headers.indexOf('SKU');
    const salesPriorityIndex = headers.indexOf('Sales Priority Level');
    const recommendedQtyIndex = headers.indexOf('Amazon Recommended Quantity');
    const dailyAvgSalesIndex = headers.indexOf('Daily Avg Sales ($)');
    const dailyVelocityIndex = headers.indexOf('Daily Velocity');
    const availableIndex = headers.indexOf('Available');

    // Add logging to check the values we're getting from analyzed report
    console.log('Column indices:', {
        priority: priorityIndex,
        sku: skuIndex,
        salesPriority: salesPriorityIndex,
        dailyVelocity: dailyVelocityIndex,
        available: availableIndex
    });

    // Create map of SKU to data from analyzed report
    const analyzedDataMap = new Map();
    for (let i = 1; i < analyzedData.length; i++) {
        const row = analyzedData[i];
        const sku = row[skuIndex];
        const analyzed = {
            priority: row[priorityIndex],
            dailyAverageSales: Number(row[dailyAvgSalesIndex]) || 0,
            dailyVelocity: Number(row[dailyVelocityIndex]) || 0,
            available: Number(row[availableIndex]) || 0
        };
        analyzedDataMap.set(sku, analyzed);
        console.log(`Analyzed data for ${sku}:`, analyzed);
    }

    // Get standardized breakdown data for UPCs and product info
    const standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
    const standardizedData = standardizedSheet.getDataRange().getValues();
    const productMap = new Map();

    // Create map of SKU to product info
    console.log('Processing Standardized Breakdown data...');
    for (let i = 1; i < standardizedData.length; i++) {
        const [sku, originalName, standardizedName, upc, quantity, type] = standardizedData[i];
        console.log(`SKU: ${sku}, Name: ${standardizedName}, UPC: ${upc}, Type: ${type}`);

        if (!productMap.has(sku)) {
            productMap.set(sku, {
                productName: originalName,
                seasoningsIncluded: standardizedName,
                seasoningsIncludedUPC: upc,
                type: type
            });
        }
    }

    // Get available inventory
    const inventorySheet = ss.getSheetByName('Available Inventory');
    const inventoryData = inventorySheet.getDataRange().getValues();
    const inventoryMap = new Map();

    // Create map of UPC to available quantity
    for (let i = 1; i < inventoryData.length; i++) {
        const [item, upc, quantity] = inventoryData[i];
        inventoryMap.set(upc, Number(quantity) || 0);
    }

    // Process analyzed data with additional logging
    const processedProducts = analyzedData.slice(1)
        .map(row => {
            const sku = row[skuIndex];
            const productInfo = productMap.get(sku);
            const analyzedInfo = analyzedDataMap.get(sku) || {};

            if (!productInfo) {
                console.warn(`Warning: No product info found for SKU ${sku}`);
                return null;
            }

            const product = {
                priority: analyzedInfo.priority,
                sku: sku,
                salesPriority: row[salesPriorityIndex],
                recommendedQty: Number(row[recommendedQtyIndex]) || 0,
                dailyAverageSales: analyzedInfo.dailyAverageSales,
                dailyVelocity: analyzedInfo.dailyVelocity,
                available: analyzedInfo.available,
                ...productInfo
            };

            console.log(`Processed product for ${sku}:`, {
                dailyVelocity: product.dailyVelocity,
                available: product.available
            });

            return product;
        })
        .filter(product => product && product.recommendedQty > 0);

    console.log(`Processed ${processedProducts.length} products`);

    console.log('Before sorting:');
    processedProducts.forEach(p => {
        console.log(`${p.sku} - ${p.productName} (${p.salesPriority}, Priority: ${p.priority})`);
    });

    // Sort products by priority
    processedProducts.sort((a, b) => {
        // First by Sales Priority Level (High > Medium > Low)
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        if (priorityOrder[a.salesPriority] !== priorityOrder[b.salesPriority]) {
            return priorityOrder[a.salesPriority] - priorityOrder[b.salesPriority];
        }
        // Then by Daily Average Sales (highest to lowest)
        if (a.dailyAverageSales !== b.dailyAverageSales) {
            return b.dailyAverageSales - a.dailyAverageSales;
        }
        // Finally by priority number if sales are equal
        return a.priority - b.priority;
    });

    console.log('\nAfter sorting:');
    processedProducts.forEach(p => {
        console.log(`${p.sku} - ${p.productName} (${p.salesPriority}, Daily Avg: $${p.dailyAverageSales.toFixed(2)}, Priority: ${p.priority})`);
    });

    // Process inventory needs
    const results = processInventoryNeeds(processedProducts, inventoryMap);

    // Write results to sheet
    const resultSheet = writeInventoryResults(results);

    return {
        results: results,
        sheet: resultSheet
    };
}

function processInventoryNeeds(products, inventoryMap) {
    console.log('Starting processInventoryNeeds');
    console.log('Number of products to process:', products.length);
    console.log('Initial inventory state:');
    inventoryMap.forEach((qty, upc) => {
        console.log(`UPC: ${upc}, Quantity: ${qty}`);
    });

    const results = [];
    const updatedInventory = new Map(inventoryMap);

    for (const product of products) {
        console.log(`Processing product ${product.sku}:`, {
            dailyVelocity: product.dailyVelocity,
            available: product.available
        });

        const result = {
            sku: product.sku,
            productName: product.productName,
            type: product.type || 'single',
            recommendedQty: product.recommendedQty,
            salesPriority: product.salesPriority,
            priority: product.priority,
            dailyAverageSales: product.dailyAverageSales,
            dailyVelocity: product.dailyVelocity,
            available: product.available,
            canFulfill: false,
            fulfillableQty: 0,
            components: []
        };

        const productType = (product.type || 'single').toLowerCase();

        if (productType === 'single') {
            const upc = product.seasoningsIncludedUPC;
            console.log(`Processing single product ${product.sku}:`);
            console.log(`- UPC from Amazon_products: ${upc}`);
            console.log(`- Available in inventory: ${inventoryMap.has(upc)}`);
            if (!upc) {
                console.warn(`Warning: No UPC found for single product ${product.sku}`);
                continue;
            }
            if (upc.length > 15) {  // Basic UPC validation
                console.error(`Error: Invalid UPC format for ${product.sku}: ${upc}`);
                continue;
            }

            const available = updatedInventory.get(upc) || 0;
            console.log(`Single product ${product.sku} (${product.productName})`);
            console.log(`UPC: ${upc}`);
            console.log(`Available inventory: ${available}`);

            const fulfillable = Math.min(product.recommendedQty, available);
            console.log(`Can fulfill ${fulfillable} out of ${product.recommendedQty} requested`);

            result.canFulfill = fulfillable >= product.recommendedQty;
            result.fulfillableQty = fulfillable;
            result.components.push({
                name: product.seasoningsIncluded,
                upc: upc,
                needed: product.recommendedQty,
                available: available,
                used: fulfillable
            });

            if (fulfillable > 0) {
                const remaining = available - fulfillable;
                updatedInventory.set(upc, remaining);
                console.log(`Updated inventory for ${upc}: ${remaining}`);
            }
        } else {
            try {
                const breakdown = breakdownInventoryBySku(product.sku);
                if (!breakdown || !breakdown.components || breakdown.components.length === 0) {
                    console.warn(`Warning: No breakdown found for combo pack ${product.sku}`);
                    continue;
                }

                console.log(`Combo pack ${product.sku} components:`);
                breakdown.components.forEach(comp => {
                    const available = updatedInventory.get(comp.upc) || 0;
                    console.log(`- ${comp.name} (${comp.upc}): ${available} available`);
                });

                let minFulfillable = Infinity;
                const componentResults = breakdown.components.map(component => {
                    const available = updatedInventory.get(component.upc) || 0;
                    const needed = product.recommendedQty * component.quantity;
                    const fulfillable = Math.floor(available / component.quantity);
                    minFulfillable = Math.min(minFulfillable, fulfillable);

                    console.log(`Component ${component.name}:`);
                    console.log(`- Available: ${available}`);
                    console.log(`- Needed: ${needed}`);
                    console.log(`- Can fulfill: ${fulfillable}`);

                    return {
                        name: component.name,
                        upc: component.upc,
                        needed: needed,
                        available: available,
                        quantity: component.quantity,
                        fulfillable: fulfillable
                    };
                });

                result.canFulfill = minFulfillable >= product.recommendedQty;
                result.fulfillableQty = Math.min(minFulfillable, product.recommendedQty);
                console.log(`Can fulfill ${result.fulfillableQty} out of ${product.recommendedQty} combo packs`);

                if (result.fulfillableQty > 0) {
                    componentResults.forEach(component => {
                        const used = result.fulfillableQty * component.quantity;
                        const remaining = component.available - used;

                        result.components.push({
                            ...component,
                            used: used
                        });

                        updatedInventory.set(component.upc, remaining);
                        console.log(`Updated inventory for ${component.upc}: ${remaining}`);
                    });
                } else {
                    result.components = componentResults.map(comp => ({
                        ...comp,
                        used: 0
                    }));
                }
            } catch (error) {
                console.error(`Error processing combo pack ${product.sku}:`, error);
                continue;
            }
        }

        results.push(result);
    }

    console.log('\nFinal inventory state:');
    updatedInventory.forEach((qty, upc) => {
        console.log(`UPC: ${upc}, Quantity: ${qty}`);
    });

    return {
        results: results,
        remainingInventory: Object.fromEntries(updatedInventory)
    };
}

function writeInventoryResults(results) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let resultSheet = ss.getSheetByName('FBA Inventory Analysis');

    // Clear or create sheet
    if (resultSheet) {
        let filter = resultSheet.getFilter();
        if (filter) {
            filter.remove();
        }
        resultSheet.clear();
    } else {
        resultSheet = ss.insertSheet('FBA Inventory Analysis');
    }

    // Define headers
    const headers = [
        'Priority Number',
        'Sales Priority',
        'Daily Avg Sales ($)',
        'SKU',
        'Product Name',
        'Type',
        'Current Available',    // From amz_fba_report_analyzed
        'Daily Velocity',       // From amz_fba_report_analyzed
        'Recommended Qty',
        'Can Fulfill?',
        'Fulfillable Qty',
        'Total Available After Shipment',
        'Days of Coverage',
        'Backorder Risk',       // New column
        'Components',
        'Component Details'
    ];

    // Prepare data rows
    const data = [headers];

    results.results.forEach(result => {
        const componentsList = result.components.map(c => c.name).join('\n');

        // Calculate backorder risk
        const currentAvailable = result.available || 0;
        const dailyVelocity = result.dailyVelocity || 0;
        const fulfillableQty = result.fulfillableQty || 0;
        const totalAfterShipment = currentAvailable + fulfillableQty;

        // Calculate days of coverage including 7-day shipping delay
        const daysOfCoverage = dailyVelocity > 0 ?
            (totalAfterShipment - (dailyVelocity * 7)) / dailyVelocity :
            999;

        // Determine backorder risk
        let backorderRisk;
        if (daysOfCoverage <= 0) {
            backorderRisk = 'High';
        } else if (daysOfCoverage <= 14) {
            backorderRisk = 'Medium';
        } else {
            backorderRisk = 'Low';
        }

        const componentDetails = result.components.map(c => {
            return `${c.name}\nNeeded: ${c.needed}\nAvailable: ${c.available}\nUsed: ${c.used}`;
        }).join('\n\n');

        data.push([
            result.priority,
            result.salesPriority,
            result.dailyAverageSales || 0,
            result.sku,
            result.productName,
            result.type,
            currentAvailable,
            dailyVelocity,
            result.recommendedQty,
            result.canFulfill ? 'Yes' : 'No',
            result.fulfillableQty,
            totalAfterShipment,
            daysOfCoverage.toFixed(1),
            backorderRisk,
            componentsList,
            componentDetails
        ]);
    });

    // Write data to sheet
    resultSheet.getRange(1, 1, data.length, headers.length).setValues(data);

    // Format sheet
    resultSheet.autoResizeColumns(1, headers.length);
    const headerRange = resultSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#f3f3f3');
    headerRange.setFontWeight('bold');

    // Format Daily Avg Sales column as currency
    const dailyAvgSalesColumn = 3; // Column C
    const dailyAvgSalesRange = resultSheet.getRange(2, dailyAvgSalesColumn, data.length - 1, 1);
    dailyAvgSalesRange.setNumberFormat('$#,##0.00');

    // Format Daily Unit Velocity column
    const velocityColumn = 10;  // Column J
    const velocityRange = resultSheet.getRange(2, velocityColumn, data.length - 1, 1);
    velocityRange.setNumberFormat('#,##0.0');

    // Format Weeks of Inventory column
    const weeksColumn = 11;  // Column K
    const weeksRange = resultSheet.getRange(2, weeksColumn, data.length - 1, 1);
    weeksRange.setNumberFormat('#,##0.0');

    // Format Stockout Date column
    const dateColumn = 12;  // Column L
    const dateRange = resultSheet.getRange(2, dateColumn, data.length - 1, 1);
    dateRange.setNumberFormat('MM/dd/yyyy');

    // Add conditional formatting for Can Fulfill column
    const canFulfillColumn = 8; // Updated column index
    const canFulfillRange = resultSheet.getRange(2, canFulfillColumn, data.length - 1, 1);

    // Create rules array
    const rules = [
        SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo('No')
            .setBackground('#ffcdd2')
            .setRanges([canFulfillRange])
            .build(),
        SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo('Yes')
            .setBackground('#c8e6c9')
            .setRanges([canFulfillRange])
            .build()
    ];

    // Apply both rules
    resultSheet.setConditionalFormatRules(rules);

    // Add conditional formatting for Weeks of Inventory
    const weeksRules = [
        SpreadsheetApp.newConditionalFormatRule()
            .whenNumberLessThan(2)
            .setBackground('#f4c7c3')
            .setRanges([weeksRange])
            .build(),
        SpreadsheetApp.newConditionalFormatRule()
            .whenNumberBetween(2, 4)
            .setBackground('#fff2cc')
            .setRanges([weeksRange])
            .build(),
        SpreadsheetApp.newConditionalFormatRule()
            .whenNumberGreaterThan(4)
            .setBackground('#d9ead3')
            .setRanges([weeksRange])
            .build()
    ];

    // Apply weeks rules
    resultSheet.setConditionalFormatRules(weeksRules);

    // Add filter
    resultSheet.getDataRange().createFilter();

    // Set row heights for components columns
    for (let i = 2; i <= data.length; i++) {
        const componentsText = String(data[i - 1][14] || '');  // Components column
        const detailsText = String(data[i - 1][15] || '');     // Component Details column

        const componentsHeight = componentsText.split('\n').length;
        const detailsHeight = detailsText.split('\n').length;

        const maxHeight = Math.max(componentsHeight, detailsHeight);
        resultSheet.setRowHeight(i, maxHeight * 15 + 5);
    }

    // Add conditional formatting for Backorder Risk
    const backorderRiskColumn = 14;  // Adjust based on column position
    const backorderRiskRange = resultSheet.getRange(2, backorderRiskColumn, data.length - 1, 1);

    const backorderRules = [
        SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo('High')
            .setBackground('#f4c7c3')  // Red
            .setRanges([backorderRiskRange])
            .build(),
        SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo('Medium')
            .setBackground('#fff2cc')  // Yellow
            .setRanges([backorderRiskRange])
            .build(),
        SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo('Low')
            .setBackground('#d9ead3')  // Green
            .setRanges([backorderRiskRange])
            .build()
    ];

    resultSheet.setConditionalFormatRules(backorderRules);

    return resultSheet;
}
