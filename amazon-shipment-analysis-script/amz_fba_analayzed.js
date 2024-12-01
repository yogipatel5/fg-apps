function getAnalyzedFBAData(ss) {
    const analyzedSheet = ss.getSheetByName('amz_fba_report_analyzed');
    const analyzedData = analyzedSheet.getDataRange().getValues();
    const headers = analyzedData[0];

    const indices = {
        priority: headers.indexOf('Priority'),
        sku: headers.indexOf('SKU'),
        salesPriority: headers.indexOf('Sales Priority Level'),
        recommendedQty: headers.indexOf('Amazon Recommended Quantity'),
        dailyAvgSales: headers.indexOf('Daily Avg Sales ($)'),
        dailyVelocity: headers.indexOf('Daily Velocity'),
        available: headers.indexOf('Available')
    };

    console.log('Column indices:', indices);

    const analyzedDataMap = new Map();
    for (let i = 1; i < analyzedData.length; i++) {
        const row = analyzedData[i];
        const sku = row[indices.sku];
        const analyzed = {
            priority: row[indices.priority],
            dailyAverageSales: Number(row[indices.dailyAvgSales]) || 0,
            dailyVelocity: Number(row[indices.dailyVelocity]) || 0,
            available: Number(row[indices.available]) || 0
        };
        analyzedDataMap.set(sku, analyzed);
    }

    return { indices, analyzedDataMap };
}
function getProductNames(ss) {
    const amazonProductsSheet = ss.getSheetByName('Amazon_products');
    const amazonProductsData = amazonProductsSheet.getDataRange().getValues();
    const amazonHeaders = amazonProductsData[0];

    const skuColumnIndex = amazonHeaders.indexOf('Merchant SKU');
    const productNameColumnIndex = amazonHeaders.indexOf('Product Name');

    const productNameMap = new Map();
    for (let i = 1; i < amazonProductsData.length; i++) {
        const sku = amazonProductsData[i][skuColumnIndex];
        const productName = amazonProductsData[i][productNameColumnIndex];
        if (sku && productName) {
            productNameMap.set(sku, productName);
        }
    }

    return productNameMap;
}
function getStandardizedBreakdown(ss, productNameMap) {
    const standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
    const standardizedData = standardizedSheet.getDataRange().getValues();
    const productMap = new Map();

    console.log('Processing Standardized Breakdown data...');
    for (let i = 1; i < standardizedData.length; i++) {
        const [sku, _, standardizedName, upc, quantity, type] = standardizedData[i];
        if (!productMap.has(sku)) {
            productMap.set(sku, {
                productName: productNameMap.get(sku) || 'Unknown Product',
                seasoningsIncluded: standardizedName,
                seasoningsIncludedUPC: upc,
                type: type
            });
        }
    }

    return productMap;
}
function getInventoryData(ss) {
    const inventorySheet = ss.getSheetByName('Available Inventory');
    const inventoryData = inventorySheet.getDataRange().getValues();
    const inventoryMap = new Map();

    for (let i = 1; i < inventoryData.length; i++) {
        const [item, upc, quantity] = inventoryData[i];
        inventoryMap.set(upc, Number(quantity) || 0);
    }

    return inventoryMap;
}
function processAmazonFBAInventory() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get all required data
    const { indices, analyzedDataMap } = getAnalyzedFBAData(ss);
    const productNameMap = getProductNames(ss);
    const productMap = getStandardizedBreakdown(ss, productNameMap);
    const inventoryMap = getInventoryData(ss);

    // Process analyzed data
    const analyzedSheet = ss.getSheetByName('amz_fba_report_analyzed');
    const analyzedData = analyzedSheet.getDataRange().getValues();

    const processedProducts = analyzedData.slice(1)
        .map(row => {
            const sku = row[indices.sku];
            const productInfo = productMap.get(sku);
            const analyzedInfo = analyzedDataMap.get(sku) || {};

            if (!productInfo) {
                console.warn(`Warning: SKU ${sku} not found in Standardized_Breakdown sheet. Also checked Amazon_products sheet: ${productNameMap.has(sku) ? 'Found' : 'Not Found'}`);
                return null;
            }

            return {
                priority: analyzedInfo.priority,
                sku: sku,
                salesPriority: row[indices.salesPriority],
                recommendedQty: Number(row[indices.recommendedQty]) || 0,
                dailyAverageSales: analyzedInfo.dailyAverageSales,
                dailyVelocity: analyzedInfo.dailyVelocity,
                available: analyzedInfo.available,
                ...productInfo
            };
        })
        .filter(product => product && product.recommendedQty > 0);

    // Sort and process products
    processedProducts.sort((a, b) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        if (priorityOrder[a.salesPriority] !== priorityOrder[b.salesPriority]) {
            return priorityOrder[a.salesPriority] - priorityOrder[b.salesPriority];
        }
        if (a.dailyAverageSales !== b.dailyAverageSales) {
            return b.dailyAverageSales - a.dailyAverageSales;
        }
        return a.priority - b.priority;
    });

    // Process inventory and write results
    const results = processInventoryNeeds(processedProducts, inventoryMap);
    const resultSheet = writeInventoryResults(results);
    const summarySheet = writeRemainingInventorySummary(results, ss);

    return {
        results: results,
        analysisSheet: resultSheet,
        summarySheet: summarySheet
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
        console.log(`\nProcessing product: ${product.sku}`);
        console.log(`Type: ${product.type}`);
        console.log(`Priority: ${product.priority}`);
        console.log(`Daily Velocity: ${product.dailyVelocity}`);

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
            if (!upc) {
                console.warn(`Warning: No UPC found for single product ${product.sku}`);
                continue;
            }

            const available = updatedInventory.get(upc) || 0;
            console.log(`Single product ${product.sku} (${product.productName})`);
            console.log(`UPC: ${upc}`);
            console.log(`Available inventory: ${available}`);

            const fulfillable = Math.min(product.recommendedQty, available);
            console.log(`Can fulfill ${fulfillable} out of ${product.recommendedQty} requested`);

            result.canFulfill = fulfillable >= product.recommendedQty ? 'Yes' :
                fulfillable > 0 ? 'Partial' : 'No';
            result.fulfillableQty = fulfillable;
            result.components.push({
                name: product.seasoningsIncluded,
                upc: upc,
                needed: product.recommendedQty,
                available: available,
                used: fulfillable
            });

            if (fulfillable > 0) {
                updatedInventory.set(upc, available - fulfillable);
                console.log(`Updated inventory for ${upc}: ${available - fulfillable}`);
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

                result.canFulfill = minFulfillable >= product.recommendedQty ? 'Yes' :
                    minFulfillable > 0 ? 'Partial' : 'No';
                result.fulfillableQty = Math.min(minFulfillable, product.recommendedQty);
                console.log(`Can fulfill ${result.fulfillableQty} out of ${product.recommendedQty} combo packs`);

                if (result.fulfillableQty > 0) {
                    componentResults.forEach(component => {
                        const used = result.fulfillableQty * component.quantity;
                        result.components.push({
                            ...component,
                            used: used
                        });
                        updatedInventory.set(component.upc, component.available - used);
                        console.log(`Updated inventory for ${component.upc}: ${component.available - used}`);
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
    const sheetName = 'FBA Inventory Analysis';

    // Define headers
    const headers = [
        'Priority Number',
        'Sales Priority',
        'Daily Avg Sales ($)',
        'SKU',
        'Product Name',
        'Type',
        'Current Available',
        'Daily Velocity',
        'Recommended Qty',
        'Can Fulfill?',
        'Fulfillable Qty',
        'Total Available After Shipment',
        'Days of Coverage',
        'Backorder Risk',
        'Components',
        'Component Details'
    ];

    // Prepare data rows
    const data = results.results.map(result => {
        const componentsList = result.components.map(c => c.name).join('\n');
        const currentAvailable = result.available || 0;
        const dailyVelocity = result.dailyVelocity || 0;
        const fulfillableQty = result.fulfillableQty || 0;
        const totalAfterShipment = currentAvailable + fulfillableQty;
        const daysOfCoverage = dailyVelocity > 0 ?
            (totalAfterShipment - (dailyVelocity * 7)) / dailyVelocity : 999;

        const backorderRisk = daysOfCoverage <= 0 ? 'High' :
            daysOfCoverage <= 14 ? 'Medium' : 'Low';

        const componentDetails = result.components.map(c =>
            `${c.name}\nNeeded: ${c.needed}\nAvailable: ${c.available}\nUsed: ${c.used}`
        ).join('\n\n');

        return [
            result.priority,
            result.salesPriority,
            result.dailyAverageSales || 0,
            result.sku,
            result.productName,
            result.type,
            currentAvailable,
            dailyVelocity,
            result.recommendedQty,
            result.canFulfill,
            result.fulfillableQty,
            totalAfterShipment,
            daysOfCoverage,
            backorderRisk,
            componentsList,
            componentDetails
        ];
    });

    // Define column formats
    const columnTypes = {
        1: 'INTEGER',           // Priority Number
        3: 'MONEY',            // Daily Avg Sales
        7: 'INTEGER',          // Current Available
        8: 'DECIMAL',          // Daily Velocity
        9: 'INTEGER',          // Recommended Qty
        11: 'INTEGER',         // Fulfillable Qty
        12: 'INTEGER',         // Total Available After Shipment
        13: 'DECIMAL'          // Days of Coverage
    };

    // Define column widths
    const columnWidths = {
        15: 300,  // Components column
        16: 400   // Component Details column
    };

    // Write data to sheet
    const sheet = writeDataToSheet(ss, {
        sheetName,
        headers,
        data,
        clearFirst: true,
        createIfMissing: true,
        columnFormats: columnTypes,
        columnWidths,
        addFilter: true,
        frozen: { rows: 1 }
    });

    // Add conditional formatting rules
    const rules = [
        // Sales Priority rules
        {
            type: 'TEXT_EQ',
            values: ['High'],
            background: '#d9ead3',
            range: sheet.getRange(2, 2, data.length, 1)
        },
        {
            type: 'TEXT_EQ',
            values: ['Medium'],
            background: '#fff2cc',
            range: sheet.getRange(2, 2, data.length, 1)
        },
        {
            type: 'TEXT_EQ',
            values: ['Low'],
            background: '#f4c7c3',
            range: sheet.getRange(2, 2, data.length, 1)
        },
        // Can Fulfill rules
        {
            type: 'TEXT_EQ',
            values: ['No'],
            background: '#ffcdd2',
            range: sheet.getRange(2, 10, data.length, 1)
        },
        {
            type: 'TEXT_EQ',
            values: ['Partial'],
            background: '#fff2cc',
            range: sheet.getRange(2, 10, data.length, 1)
        },
        {
            type: 'TEXT_EQ',
            values: ['Yes'],
            background: '#c8e6c9',
            range: sheet.getRange(2, 10, data.length, 1)
        },
        // Backorder Risk rules
        {
            type: 'TEXT_EQ',
            values: ['High'],
            background: '#f4c7c3',
            range: sheet.getRange(2, 14, data.length, 1)
        },
        {
            type: 'TEXT_EQ',
            values: ['Medium'],
            background: '#fff2cc',
            range: sheet.getRange(2, 14, data.length, 1)
        },
        {
            type: 'TEXT_EQ',
            values: ['Low'],
            background: '#d9ead3',
            range: sheet.getRange(2, 14, data.length, 1)
        }
    ];

    setConditionalFormatting(ss, rules);

    // Set row heights based on content
    const rowHeights = {};
    for (let i = 2; i <= data.length + 1; i++) {
        const componentsText = String(data[i - 2][14] || '');
        const detailsText = String(data[i - 2][15] || '');
        const maxLines = Math.max(
            componentsText.split('\n').length,
            detailsText.split('\n').length
        );
        rowHeights[i] = maxLines * 15 + 5;
    }
    setRowHeights(ss, rowHeights);

    return sheet;
}
// Remaining inventory left in the system after allocations
function calculateRemainingInventory(results) {
    const remainingInventory = new Map();
    results.remainingInventory.forEach((qty, upc) => {
        remainingInventory.set(upc, qty);
    });
    return remainingInventory;
}
function writeRemainingInventorySummary(results, ss) {
    const sheetName = 'Remaining Inventory Summary';
    const headers = ['Component Name', 'UPC', 'Remaining Quantity'];

    // Prepare data
    const remainingInventory = new Map();
    results.results.forEach(result => {
        result.components.forEach(component => {
            const remaining = results.remainingInventory[component.upc] || 0;
            remainingInventory.set(component.upc, {
                name: component.name,
                quantity: remaining
            });
        });
    });

    const data = Array.from(remainingInventory).map(([upc, info]) => [
        info.name,
        upc,
        info.quantity
    ]);

    // Define column formats
    const columnTypes = {
        3: 'INTEGER'  // Remaining Quantity
    };

    // Write data to sheet
    return writeDataToSheet(ss, {
        sheetName,
        headers,
        data,
        clearFirst: true,
        createIfMissing: true,
        columnFormats: columnTypes,
        addFilter: true,
        frozen: { rows: 1 }
    });
}
