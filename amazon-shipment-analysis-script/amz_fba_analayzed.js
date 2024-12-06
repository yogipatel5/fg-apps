const debug = false;
const { ColumnFormats } = initialize();

function logit(message) {
    if (debug) {
        console.log(message);
    }
}

// Define column configuration using the ColumnFormats from sheet_formatter_helper.js
const COLUMNS = {
    SALES_PRIORITY: {
        header: 'Sales Priority',
        index: 1,
        format: ColumnFormats.TEXT.format,  // This will use the ColumnFormats from sheet_formatter_helper.js
        width: null,
        conditionalFormatting: [
            { value: 'Low', background: '#d9ead3' },    // Green
            { value: 'Medium', background: '#fff2cc' },  // Yellow
            { value: 'High', background: '#f4c7c3' }    // Red
        ]
    },
    PRIORITY_NUMBER: {
        header: 'Priority Number',
        index: 2,
        format: ColumnFormats.INTEGER.format
    },
    DAILY_AVG_SALES: {
        header: 'Daily Avg Sales ($)',
        index: 3,
        format: ColumnFormats.MONEY.format
    },
    SKU: {
        header: 'SKU',
        index: 4,
        format: ColumnFormats.TEXT.format
    },
    PRODUCT_NAME: {
        header: 'Product Name',
        index: 5,
        format: ColumnFormats.TEXT.format
    },
    TYPE: {
        header: 'Type',
        index: 6,
        format: ColumnFormats.TEXT.format
    },
    CURRENT_AVAILABLE: {
        header: 'Current Available',
        index: 7,
        format: ColumnFormats.INTEGER.format
    },
    DAILY_VELOCITY: {
        header: 'Daily Velocity',
        index: 8,
        format: ColumnFormats.DECIMAL.format
    },
    RECOMMENDED_QTY: {
        header: 'Recommended Qty',
        index: 9,
        format: ColumnFormats.INTEGER.format
    },
    SCHEDULED_QTY: {
        header: 'Scheduled Qty',
        index: 10,
        format: ColumnFormats.INTEGER.format
    },
    TOTAL_AVAILABLE: {
        header: 'Total Available After Shipment',
        index: 11,
        format: ColumnFormats.INTEGER.format
    },
    CAN_FULFILL: {
        header: 'Can Fulfill?',
        index: 12,
        format: ColumnFormats.TEXT.format,
        width: 150,
        conditionalFormatting: [
            { value: 'Yes', background: '#d9ead3' },     // Green
            { value: 'Partial', background: '#fff2cc' }, // Yellow
            { value: 'No', background: '#f4c7c3' }       // Red
        ]
    },
    BACKORDER_RISK: {
        header: 'Backorder Risk',
        index: 13,
        format: ColumnFormats.TEXT.format,
        conditionalFormatting: [
            { value: 'Low', background: '#d9ead3' },    // Green
            { value: 'Medium', background: '#fff2cc' },  // Yellow
            { value: 'High', background: '#f4c7c3' }    // Red
        ]
    },
    FULFILLABLE_QTY: {
        header: 'Fulfillable Qty',
        index: 14,
        format: ColumnFormats.INTEGER.format
    },
    DAYS_OF_COVERAGE: {
        header: 'Days of Coverage',
        index: 15,
        format: ColumnFormats.DECIMAL.format
    },
    NUMBER_OF_COMPONENTS: {
        header: 'No. of Components',
        index: 16,
        format: ColumnFormats.INTEGER.format,
        conditionalFormatting: [
            { value: '1', background: '#d9ead3' },    // Green for single component
            { value: '2', background: '#fff2cc' },   // Yellow for 2 components
            { value: '3', background: '#f4c7c3' }    // Red for 3 or more components
        ]
    },
    COMPONENTS: {
        header: 'Components',
        index: 17,
        format: ColumnFormats.TEXT.format,
        width: 300
    },
    COMPONENT_DETAILS: {
        header: 'Component Details',
        index: 18,
        format: ColumnFormats.TEXT.format,
        width: 300,
        hidden: true
    },
    TOTAL_WEIGHT_OZ: {
        header: 'Total Weight (oz)',
        index: 19,
        format: ColumnFormats.DECIMAL.format,
        width: 120
    }
};

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

    logit('Column indices:', indices);

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
    const headers = standardizedData[0];
    const weightIndex = headers.indexOf('Weight_Oz');
    const productMap = new Map();

    logit('Processing Standardized Breakdown data...');
    for (let i = 1; i < standardizedData.length; i++) {
        const [sku, _, standardizedName, upc, quantity, type] = standardizedData[i];
        const weight = Number(standardizedData[i][weightIndex]) || 0;

        if (!productMap.has(sku)) {
            productMap.set(sku, {
                productName: productNameMap.get(sku) || 'Unknown Product',
                seasoningsIncluded: standardizedName,
                seasoningsIncludedUPC: upc,
                type: type,
                weight: weight
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
function getScheduledQuantities(ss) {
    const shipmentsSheet = ss.getSheetByName('Shipments_to_Amazon');
    if (!shipmentsSheet) {
        console.warn('Shipments_to_Amazon sheet not found');
        return new Map();
    }

    const shipmentData = shipmentsSheet.getDataRange().getValues();
    const headers = shipmentData[0];

    const indices = {
        status: headers.indexOf('Status'),
        sku: headers.indexOf('Merchant SKU'),
        quantity: headers.indexOf('Quantity')
    };

    // Skip if required columns not found
    if (indices.status === -1 || indices.sku === -1 || indices.quantity === -1) {
        console.warn('Required columns not found in Shipments_to_Amazon sheet');
        return new Map();
    }

    const scheduledQty = new Map();

    // Start from 1 to skip headers
    for (let i = 1; i < shipmentData.length; i++) {
        const row = shipmentData[i];
        const status = row[indices.status];
        const sku = row[indices.sku];
        const quantity = Number(row[indices.quantity]) || 0;

        // Only count items in 'Prep' status
        if (status === 'Prep') {
            const currentQty = scheduledQty.get(sku) || 0;
            scheduledQty.set(sku, currentQty + quantity);
        }
    }

    return scheduledQty;
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
    logit('Starting processInventoryNeeds');
    logit('Number of products to process:', products.length);
    logit('Initial inventory state:');
    inventoryMap.forEach((qty, upc) => {
        logit(`UPC: ${upc}, Quantity: ${qty}`);
    });

    const results = [];
    const updatedInventory = new Map(inventoryMap);

    // Get scheduled quantities
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduledQty = getScheduledQuantities(ss);

    function roundToPackSize(quantity, type) {
        if (quantity < 10) return quantity; // Minimum threshold

        if (type.toLowerCase() === 'single') {
            // Round down to nearest multiple of 60
            return Math.floor(quantity / 60) * 60 || 10;
        } else if (type.toLowerCase() === 'combo') {
            // Round down to nearest multiple of 8
            return Math.floor(quantity / 8) * 8 || 10;
        }
        return quantity;
    }

    function calculateFulfillmentStatus(fulfillable, recommended) {
        const fulfillmentRatio = recommended > 0 ? fulfillable / recommended : 0;
        if (fulfillmentRatio >= 0.9) return 'Yes';  // 90% or more
        if (fulfillmentRatio > 0) return 'Partial';
        return 'No';
    }

    for (const product of products) {
        logit(`\nProcessing product: ${product.sku}`);
        logit(`Type: ${product.type}`);
        logit(`Priority: ${product.priority}`);
        logit(`Daily Velocity: ${product.dailyVelocity}`);

        const scheduled = scheduledQty.get(product.sku) || 0;
        const adjustedRecommendedQty = Math.max(0, product.recommendedQty - scheduled);

        const result = {
            sku: product.sku,
            productName: product.productName,
            type: product.type || 'single',
            recommendedQty: product.recommendedQty,
            scheduledQty: scheduled,
            adjustedRecommendedQty,
            salesPriority: product.salesPriority,
            priority: product.priority,
            dailyAverageSales: product.dailyAverageSales,
            dailyVelocity: product.dailyVelocity,
            available: product.available,
            canFulfill: false,
            fulfillableQty: 0,
            totalWeightOz: 0,
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
            logit(`Single product ${product.sku} (${product.productName})`);
            logit(`UPC: ${upc}`);
            logit(`Available inventory: ${available}`);

            let fulfillable = Math.min(adjustedRecommendedQty, available);
            // Round to pack size
            fulfillable = roundToPackSize(fulfillable, 'single');

            logit(`Can fulfill ${fulfillable} out of ${adjustedRecommendedQty} requested (after accounting for ${scheduled} scheduled)`);

            result.canFulfill = calculateFulfillmentStatus(fulfillable, adjustedRecommendedQty);
            result.fulfillableQty = fulfillable;
            result.components.push({
                name: product.seasoningsIncluded,
                upc: upc,
                needed: adjustedRecommendedQty,
                available: available,
                used: fulfillable
            });

            if (fulfillable > 0) {
                updatedInventory.set(upc, available - fulfillable);
                logit(`Updated inventory for ${upc}: ${available - fulfillable}`);
            }

            result.totalWeightOz = product.weight || 0;

        } else {
            try {
                const breakdown = breakdownInventoryBySku(product.sku);
                if (!breakdown || !breakdown.components || breakdown.components.length === 0) {
                    console.warn(`Warning: No breakdown found for combo pack ${product.sku}`);
                    continue;
                }

                // Calculate total weight from all components
                let totalWeight = 0;
                breakdown.components.forEach(comp => {
                    const componentInfo = getComponentInfo(comp.upc);
                    if (componentInfo && componentInfo.weight) {
                        totalWeight += (componentInfo.weight * comp.quantity);
                    }
                });

                // Add packaging weight for combo
                result.totalWeightOz = totalWeight + 0.43;

                logit(`Combo pack ${product.sku} components:`);
                breakdown.components.forEach(comp => {
                    const available = updatedInventory.get(comp.upc) || 0;
                    logit(`- ${comp.name} (${comp.upc}): ${available} available`);
                });

                let minFulfillable = Infinity;
                const componentResults = breakdown.components.map(component => {
                    const available = updatedInventory.get(component.upc) || 0;
                    const needed = adjustedRecommendedQty * component.quantity;
                    const fulfillable = Math.floor(available / component.quantity);
                    minFulfillable = Math.min(minFulfillable, fulfillable);

                    return {
                        name: component.name,
                        upc: component.upc,
                        needed: needed,
                        available: available,
                        quantity: component.quantity,
                        fulfillable: fulfillable
                    };
                });

                // Round to pack size for combo
                let finalFulfillable = Math.min(minFulfillable, adjustedRecommendedQty);
                finalFulfillable = roundToPackSize(finalFulfillable, 'combo');

                result.canFulfill = calculateFulfillmentStatus(finalFulfillable, adjustedRecommendedQty);
                result.fulfillableQty = finalFulfillable;

                if (finalFulfillable > 0) {
                    componentResults.forEach(component => {
                        const used = finalFulfillable * component.quantity;
                        result.components.push({
                            ...component,
                            used: used
                        });
                        updatedInventory.set(component.upc, component.available - used);
                        logit(`Updated inventory for ${component.upc}: ${component.available - used}`);
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

    return {
        results: results,
        remainingInventory: Object.fromEntries(updatedInventory)
    };
}

// Add this new helper function to get component information
function getComponentInfo(upc) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const standardizedSheet = ss.getSheetByName('Standardized_Breakdown');
    const data = standardizedSheet.getDataRange().getValues();
    const headers = data[0];

    const upcIndex = headers.indexOf('UPC');
    const weightIndex = headers.indexOf('Weight_Oz');

    if (upcIndex === -1 || weightIndex === -1) {
        console.warn('Required columns not found in Standardized_Breakdown');
        return null;
    }

    for (let i = 1; i < data.length; i++) {
        if (data[i][upcIndex] === upc) {
            return {
                weight: Number(data[i][weightIndex]) || 0
            };
        }
    }

    return null;
}

function writeInventoryResults(results) {
    const { ColumnFormats } = initialize();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = 'FBA Inventory Analysis';

    // Get scheduled quantities
    const scheduledQty = getScheduledQuantities(ss);

    // Generate headers from column config
    const headers = Object.values(COLUMNS).map(col => col.header);

    // Prepare data rows
    const data = results.results.map(result => {
        // Format components with quantities
        const componentsList = result.components.map(c =>
            `${c.name} (${c.quantity || 1}x)`
        ).join('\n');

        // Add a summary line with total component count
        const totalComponents = result.components.length;
        const componentSummary = `${totalComponents} component${totalComponents > 1 ? 's' : ''}`;
        const fullComponentsList = `${componentSummary}\n${componentsList}`;

        const currentAvailable = Number(result.available) || 0;
        const dailyVelocity = Number(result.dailyVelocity) || 0;
        const fulfillableQty = Number(result.fulfillableQty) || 0;
        const scheduled = scheduledQty.get(result.sku) || 0;
        const totalAfterShipment = currentAvailable + fulfillableQty + scheduled;

        const daysOfCoverage = dailyVelocity > 0 ?
            Math.round((totalAfterShipment - (dailyVelocity * 7)) / dailyVelocity) :
            999;

        const backorderRisk = daysOfCoverage <= 0 ? 'High' :
            daysOfCoverage <= 14 ? 'Medium' : 'Low';

        const componentDetails = result.components.map(c =>
            `${c.name}\nNeeded: ${c.needed}\nAvailable: ${c.available}\nUsed: ${c.used}`
        ).join('\n\n');

        // Create row data using column configuration
        const rowData = new Array(Object.keys(COLUMNS).length);
        rowData[COLUMNS.SALES_PRIORITY.index - 1] = result.salesPriority || '';
        rowData[COLUMNS.PRIORITY_NUMBER.index - 1] = parseInt(result.priority) || 0;
        rowData[COLUMNS.DAILY_AVG_SALES.index - 1] = Number(result.dailyAverageSales) || 0;
        rowData[COLUMNS.SKU.index - 1] = result.sku || '';
        rowData[COLUMNS.PRODUCT_NAME.index - 1] = result.productName || '';
        rowData[COLUMNS.TYPE.index - 1] = result.type || '';
        rowData[COLUMNS.CURRENT_AVAILABLE.index - 1] = currentAvailable;
        rowData[COLUMNS.DAILY_VELOCITY.index - 1] = dailyVelocity;
        rowData[COLUMNS.RECOMMENDED_QTY.index - 1] = Number(result.recommendedQty) || 0;
        rowData[COLUMNS.SCHEDULED_QTY.index - 1] = scheduled;
        rowData[COLUMNS.TOTAL_AVAILABLE.index - 1] = totalAfterShipment;
        rowData[COLUMNS.CAN_FULFILL.index - 1] = result.canFulfill || 'No';
        rowData[COLUMNS.BACKORDER_RISK.index - 1] = backorderRisk;
        rowData[COLUMNS.FULFILLABLE_QTY.index - 1] = fulfillableQty;
        rowData[COLUMNS.DAYS_OF_COVERAGE.index - 1] = daysOfCoverage;
        rowData[COLUMNS.NUMBER_OF_COMPONENTS.index - 1] = totalComponents;
        rowData[COLUMNS.COMPONENTS.index - 1] = componentsList;
        rowData[COLUMNS.COMPONENT_DETAILS.index - 1] = componentDetails;
        rowData[COLUMNS.TOTAL_WEIGHT_OZ.index - 1] = result.totalWeightOz || 0;

        return rowData;
    });

    // Generate column formats
    const columnFormats = {};
    Object.values(COLUMNS).forEach(col => {
        if (col.format) {
            columnFormats[col.index] = col.format;
        }
    });

    // Generate column widths
    const columnWidths = {};
    Object.values(COLUMNS).forEach(col => {
        if (col.width) {
            columnWidths[col.index] = col.width;
        }
    });

    // Generate conditional formatting rules
    const rules = [];
    Object.values(COLUMNS).forEach(col => {
        if (col.conditionalFormatting) {
            col.conditionalFormatting.forEach(rule => {
                rules.push({
                    type: 'TEXT_EQ',
                    values: [rule.value],
                    background: rule.background,
                    range: {
                        startRow: 2,
                        startCol: col.index,
                        endRow: data.length + 1,
                        endCol: col.index
                    }
                });
            });
        }
    });

    // Write data to sheet
    const sheet = writeDataToSheet(ss, {
        sheetName,
        headers,
        data,
        clearFirst: true,
        createIfMissing: true,
        columnFormats,
        columnWidths,
        addFilter: true,
        frozen: { rows: 1 },
        alternateRows: true,
        alternateColors: {
            even: "#f3f3f3",
            odd: "#ffffff"
        },
        headerFormatting: {
            wrap: Object.values(COLUMNS).map(col => col.index)  // Wrap all headers
        }
    });

    // Hide columns marked as hidden
    Object.values(COLUMNS).forEach(col => {
        if (col.hidden) {
            sheet.hideColumns(col.index);
        }
    });

    // Apply conditional formatting
    sheet.clearConditionalFormatRules();
    rules.forEach(rule => {
        const range = sheet.getRange(
            rule.range.startRow,
            rule.range.startCol,
            rule.range.endRow - rule.range.startRow + 1,
            rule.range.endCol - rule.range.startCol + 1
        );

        const formatRule = SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo(rule.values[0])
            .setBackground(rule.background)
            .setRanges([range])
            .build();

        const currentRules = sheet.getConditionalFormatRules();
        currentRules.push(formatRule);
        sheet.setConditionalFormatRules(currentRules);
    });

    // Add component details as notes
    data.forEach((row, index) => {
        const componentDetails = row[COLUMNS.COMPONENT_DETAILS.index - 1];
        if (componentDetails) {
            const cell = sheet.getRange(index + 2, COLUMNS.CAN_FULFILL.index);
            cell.setNote(componentDetails);
        }
    });

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
    if (!results || !results.results) {
        console.error('No results data provided to writeRemainingInventorySummary');
        return null;
    }

    const sheetName = 'Remaining Inventory Summary';
    const headers = ['Component Name', 'UPC', 'Remaining Quantity'];

    // Prepare data
    const remainingInventory = new Map();

    // Safely access the results
    if (Array.isArray(results.results)) {
        results.results.forEach(result => {
            if (result.components && Array.isArray(result.components)) {
                result.components.forEach(component => {
                    const remaining = results.remainingInventory[component.upc] || 0;
                    remainingInventory.set(component.upc, {
                        name: component.name,
                        quantity: remaining
                    });
                });
            }
        });
    }

    const data = Array.from(remainingInventory).map(([upc, info]) => [
        info.name,
        upc,
        info.quantity
    ]);

    // Define column formats
    const columnTypes = {
        3: 'INTEGER'  // Remaining Quantity
    };

    // If no spreadsheet provided, get active spreadsheet
    if (!ss) {
        ss = SpreadsheetApp.getActiveSpreadsheet();
    }

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

function runAnalysis() {
    return processAmazonFBAInventory();
}