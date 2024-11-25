/**
 * Class to handle different product creation strategies for the dashboard
 */
class DashboardProductCreator {
    constructor(dashboardSheet) {
        this.dashboardSheet = dashboardSheet;
        this.validVariantTypes = ['Bundle', 'Gift Message', 'Ebook', 'Simple (No Options)'];
        this.headers = this.dashboardSheet.getRange(1, 1, 1, this.dashboardSheet.getLastColumn()).getValues()[0];
        this._validateHeaders(this._getRequiredHeaders());
    }

    /**
     * Gets required headers based on variant types
     * @private
     */
    _getRequiredHeaders() {
        const baseHeaders = ['type', 'id', 'sku', 'name', 'enabled', 'slug', 'description'];
        const bundleHeaders = Array.from({ length: 40 }, (_, i) => [
            `item${i + 1}_sku`,
            `item${i + 1}_qty`,
            `item${i + 1}_badge`
        ]).flat();
        return [...baseHeaders, ...bundleHeaders];
    }

    /**
     * Validates sheet headers
     * @private
     */
    _validateHeaders(requiredHeaders) {
        const sheetHeaders = this.dashboardSheet.getRange(1, 1, 1, this.dashboardSheet.getLastColumn()).getValues()[0];
        const missingHeaders = requiredHeaders.filter(header => !sheetHeaders.includes(header));
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }
    }

    /**
     * Checks if a row with the same SKU already exists
     * @private
     */
    _rowExists(data) {
        const allRows = this.dashboardSheet.getDataRange().getValues();
        const skuColumn = this.headers.indexOf('sku');

        if (skuColumn === -1) {
            console.warn('SKU column not found in headers');
            return false;
        }

        // Skip header row when checking
        return allRows.slice(1).some(row => row[skuColumn] === data.sku);
    }

    /**
     * Creates a product entry with validation and error handling
     */
    createProduct(product) {
        try {
            // Validate required fields
            if (!product.sku || !product.name) {
                throw new Error(`Missing required fields for product: ${JSON.stringify(product)}`);
            }

            const productRow = {
                type: 'product',
                id: product.id?.toString() || '',
                sku: product.sku,
                name: product.name,
                enabled: product.enabled?.toString() || '1',
                slug: product.slug || this._createSlug(product.name),
                description: product.description || ''
            };

            if (!this._rowExists(productRow)) {
                this._appendFormattedRow(productRow);
            } else {
                console.log(`Product ${product.sku} already exists, skipping...`);
            }
        } catch (error) {
            console.error(`Failed to create product ${product.sku}:`, error);
            throw error;
        }
    }

    /**
     * Creates a variant entry with validation and error handling
     */
    createVariant(variant) {
        try {
            // Validate required fields
            if (!variant.sku || !variant.parent_sku || !variant.name) {
                throw new Error(`Missing required fields for variant: ${JSON.stringify(variant)}`);
            }

            const variantRow = {
                type: 'variant',
                id: variant.id?.toString() || '',
                sku: variant.sku,
                parent_sku: variant.parent_sku,
                upc: variant.upc || variant.sku,
                name: variant.name,
                titlename: variant.name,
                slug: '',
                description: '',
                enabled: variant.enabled?.toString() || '1',
                external_url: '',
                options: '',
                variant_type: this._determineVariantType(variant),
                product_type: 'Seasoning',
                buy_button_text: '',
                in_stock_text: '',
                download_link: '',
                hide_options_from_display_name: '0',
                customer_service_can_add: '1',
                price1_name: '',
                price1_value: '',
                price2_name: '',
                price2_value: '',
                price3_name: '',
                price3_value: '',
                price4_name: '',
                price4_value: '',
                price5_name: '',
                price5_value: '',
                price6_name: '',
                price6_value: '',
                price7_name: '',
                price7_value: '',
                price8_name: '',
                price8_value: '',
                price9_name: '',
                price9_value: '',
                price10_name: '',
                price10_value: '',
                price11_name: '',
                price11_value: '',
                price12_name: '',
                price12_value: '',
                price13_name: '',
                price13_value: '',
                price14_name: '',
                price14_value: '',
                price15_name: '',
                price15_value: ''
            };

            // Handle variant-specific fields
            switch (variantRow.variant_type) {
                case 'Bundle':
                    if (!variant.items || !Array.isArray(variant.items)) {
                        throw new Error(`Bundle variant missing items array: ${variant.sku}`);
                    }
                    // Add each bundle item
                    variant.items.forEach((item, index) => {
                        if (!item.sku || typeof item.qty === 'undefined') {
                            throw new Error(`Invalid bundle item at index ${index} for ${variant.sku}`);
                        }
                        variantRow[`item${index + 1}_sku`] = item.sku;
                        variantRow[`item${index + 1}_qty`] = item.qty.toString();
                        variantRow[`item${index + 1}_badge`] = item.badge || '';
                    });
                    break;

                case 'Gift Message':
                    variantRow.description = variant.description || '';
                    break;

                case 'Ebook':
                    if (!variant.download_link) {
                        throw new Error(`Ebook variant missing download_link: ${variant.sku}`);
                    }
                    variantRow.download_link = variant.download_link;
                    break;
            }

            if (!this._rowExists(variantRow)) {
                this._appendFormattedRow(variantRow);
                console.log(`Created variant ${variant.sku} with type ${variantRow.variant_type}`);
                if (variant.items) {
                    console.log(`Added ${variant.items.length} items to bundle`);
                }
            } else {
                console.log(`Variant ${variant.sku} already exists, skipping...`);
            }
        } catch (error) {
            console.error(`Failed to create variant ${variant.sku}:`, error);
            throw error;
        }
    }

    /**
     * Creates a bundle product with variants
     * @param {Object} product - The source product data
     */
    createBundleProduct(product) {
        // Create parent product according to rules
        const parentProduct = {
            type: 'product',
            id: '',  // Required field
            sku: this._getParentSku(product),
            name: product.Group_Product || product.Item_Name,
            enabled: '1',
            slug: this._createSlug(product.Group_Product || product.Item_Name),
            description: '',  // Optional for products
            // Removed unnecessary fields that products shouldn't have
        };

        // Create variant according to Bundle rules
        const variant = {
            type: 'variant',
            id: '',  // Required field
            sku: product.SKU,
            parent_sku: parentProduct.sku,  // Required for variants
            name: product.Item_Name,
            enabled: '1',
            variant_type: 'Bundle',  // Required for bundles
            // Removed unnecessary fields
        };

        // Add bundle items based on SKU pattern
        this._addBundleItems(variant, product);

        this._appendFormattedRow(parentProduct);
        this._appendFormattedRow(variant);
    }

    /**
     * Adds bundle items based on SKU pattern
     * @private
     */
    _addBundleItems(variant, product) {
        const packSize = this._getPackSize(product);
        const items = this._getBundleItems(product.SKU, packSize);

        // According to rules: itemX_sku and itemX_qty must be non-null and valid
        items.forEach((item, index) => {
            if (item.sku && item.qty > 0) {  // Validation per rules
                variant[`item${index + 1}_sku`] = item.sku;
                variant[`item${index + 1}_qty`] = item.qty;
            }
        });
    }

    /**
     * Creates a SKU from a product name
     * @private
     * @param {string} name - The product name to convert to SKU
     * @returns {string} The generated SKU
     */
    _createSkuFromName(name) {
        // For Meal Prep Combo, return MPC
        if (name.includes('Meal Prep Combo')) {
            return 'MPC';
        }

        // For other products, create SKU from name
        return name
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .replace(/THE-/g, '')  // Remove "THE-" from SKU
            .replace(/-COMBO$|-PACK$/g, '');  // Remove "-COMBO" or "-PACK" from end
    }

    /**
     * Determines parent SKU from group product or item name
     * @private
     */
    _getParentSku(product) {
        if (product.Group_Product) {
            return this._createSkuFromName(product.Group_Product);
        }

        // If no group product, extract base SKU from variant SKU
        const skuParts = product.SKU.split('-');
        if (skuParts[0].match(/^\d+PK$/)) {
            // If SKU starts with a pack size (like "4PK"), use the next part
            return skuParts[1];
        }
        return skuParts[0];
    }

    /**
     * Gets pack size from product info
     * @private
     */
    _getPackSize(product) {
        // Try to extract number from SKU first
        const skuMatch = product.SKU.match(/(\d+)PK|SET-(\d+)|[^0-9](\d+)$/);
        if (skuMatch) {
            return parseInt(skuMatch[1] || skuMatch[2] || skuMatch[3]);
        }

        // Try to extract from name
        const nameMatch = product.Item_Name.match(/\((\d+)\s*Set\)/i);
        return nameMatch ? parseInt(nameMatch[1]) : 2; // Default to 2 if no size found
    }

    /**
     * Gets bundle items based on SKU and pack size
     * @private
     */
    _getBundleItems(sku, packSize) {
        const skuMappings = {
            'MPC': ['SN-EVRY', 'SN-GRLV', 'SN-TACO', 'SN-ITZS', 'SN-EVBG', 'TP-BCRL'],  // Meal Prep Combo items
            'CP-CLSC': ['SN-EVRY', 'SN-GRLV', 'SN-EVSP'],
            'CP-KTO': ['SN-EVRY', 'SN-TACO'],
            'BRKFSTCLB': ['SN-CHDN', 'TP-PMPI'],
        };

        const baseSkuPattern = Object.keys(skuMappings).find(pattern => sku.includes(pattern));
        if (baseSkuPattern) {
            const baseItems = skuMappings[baseSkuPattern];

            // Take only the first N items based on pack size
            return baseItems.slice(0, packSize).map(itemSku => ({
                sku: itemSku,
                qty: '1'
            }));
        }

        return [];
    }

    /**
     * Helper function to create a URL-friendly slug
     * @private
     */
    _createSlug(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    /**
     * Helper function to append a row in the correct column order
     * @private
     */
    _appendFormattedRow(product) {
        // Create an array of only non-empty values with their headers
        const nonEmptyFields = Object.entries(product)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        // Get headers and map to values, maintaining order
        const headers = this.dashboardSheet.getRange(1, 1, 1, this.dashboardSheet.getLastColumn()).getValues()[0];
        const rowData = headers.map(header => nonEmptyFields[header] || '');

        this.dashboardSheet.appendRow(rowData);
    }

    /**
     * Determines variant type based on data
     * @private
     */
    _determineVariantType(variant) {
        if (variant.items) return 'Bundle';
        if (variant.sku === 'GIFT-MESSAGE') return 'Gift Message';
        if (variant.download_link) return 'Ebook';
        return 'Simple (No Options)';
    }

    /**
     * Gets a formatted string representation of the sheet data
     * @returns {Object[]} Array of objects with non-empty values
     */
    getFormattedSheetData() {
        const dashboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard Upload');
        if (!dashboardSheet) {
            return 'Dashboard Upload sheet not found';
        }

        const data = dashboardSheet.getDataRange().getValues();
        const headers = data[0];

        // Convert each row to an object, excluding empty values
        const formattedRows = data.slice(1).map(row => {
            const rowObj = {};
            headers.forEach((header, index) => {
                if (row[index] !== '' && row[index] != null && row[index] !== undefined) {
                    rowObj[header] = row[index];
                }
            });
            return rowObj;
        });

        // Log each row in a readable format
        formattedRows.forEach(row => {
            console.log('\nRow:');
            Object.entries(row).forEach(([key, value]) => {
                console.log(`${key}: ${value}`);
            });
        });

        return formattedRows;
    }
}


function testSampleData() {
    const sampleData = [
        {
            'type': 'variant',
            'id': 1228,
            'sku': 'GIFT-MESSAGE',
            'parent_sku': 'GIFT-MESSAGE',
            'name': 'Gift Message',
            'enabled': 1,
            'slug': null,
            'description': null
        },
        {
            'type': 'product',
            'id': 386,
            'sku': 'CP-BST-SLRS',
            'parent_sku': null,
            'name': 'OLD - Best Sellers Pack',
            'enabled': 1,
            'slug': 'best-sellers-pack'
        },
        {
            'type': 'variant',
            'id': 1240,
            'sku': 'CP-BST-SLRS',
            'parent_sku': 'CP-BST-SLRS',
            'name': 'OLD - Best Sellers Pack',
            'enabled': 1,
            'slug': null,
            'items': [
                { 'sku': 'FG-RANCH', 'qty': 1 },
                { 'sku': '12312423534', 'qty': 1 }
            ]
        },
        {
            'type': 'product',
            'id': 387,
            'sku': 'CP-ULTFNSH',
            'parent_sku': null,
            'name': 'OLD - Ultimate Finisher Combo',
            'enabled': 1,
            'slug': 'ultimate-finisher-combo'
        }
    ];

    try {
        const dashboardUploadSheet = createDashboardUploadSheet();
        const creator = new DashboardProductCreator(dashboardUploadSheet);

        const results = {
            totalTests: sampleData.length,
            productsCreated: 0,
            variantsCreated: 0,
            failures: [],
            createdItems: []
        };

        // Process each item
        sampleData.forEach((item, index) => {
            try {
                if (item.type === 'product') {
                    creator.createProduct(item);
                    results.productsCreated++;
                    results.createdItems.push({
                        type: 'product',
                        sku: item.sku,
                        status: 'success'
                    });
                } else if (item.type === 'variant') {
                    creator.createVariant(item);
                    results.variantsCreated++;
                    results.createdItems.push({
                        type: 'variant',
                        sku: item.sku,
                        parentSku: item.parent_sku,
                        status: 'success',
                        bundleItems: item.items ? item.items.length : 0
                    });
                }
            } catch (error) {
                results.failures.push({
                    item: item.sku,
                    error: error.message
                });
            }
        });

        // Get final sheet data
        const finalData = creator.getFormattedSheetData();

        // Return test summary
        return {
            testSummary: results,
            sheetData: finalData,
            testsPassed: results.failures.length === 0,
            message: results.failures.length === 0
                ? 'All tests passed successfully'
                : `${results.failures.length} tests failed`
        };

    } catch (error) {
        return {
            testsPassed: false,
            error: error.message,
            message: 'Test suite failed to execute'
        };
    }
}

function runTests() {
    const results = testSampleData();
    console.log('Test Results:', JSON.stringify(results, null, 2));
    return results;
}