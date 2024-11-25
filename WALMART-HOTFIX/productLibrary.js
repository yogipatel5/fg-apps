/**
 * Product Library for managing Walmart product operations
 */
class ProductLibrary {
    constructor() {
        this.ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    /**
     * Gets sheet by name with error handling
     * @param {string} sheetName - Name of the sheet to get
     * @returns {GoogleAppsScript.Spreadsheet.Sheet} - The requested sheet
     */
    getSheet(sheetName) {
        const sheet = this.ss.getSheetByName(sheetName);
        if (!sheet) {
            throw new Error(`Could not find sheet: ${sheetName}`);
        }
        return sheet;
    }

    /**
     * Converts sheet data to array of objects using headers
     * @param {Array} data - 2D array of sheet data
     * @returns {Array} Array of objects with header keys
     */
    dataToObjects(data) {
        const headers = data[0];
        return data.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });
    }

    /**
     * Gets all products from PVPV_Export sheet
     * @returns {Array} Array of product objects
     */
    getPVPVProducts() {
        const sheet = this.getSheet('PVPV_Export');
        const data = sheet.getDataRange().getValues();
        return this.dataToObjects(data);
    }

    /**
     * Gets all products from Compiled sheet
     * @returns {Array} Array of product objects
     */
    getCompiledProducts() {
        const sheet = this.getSheet('Compiled');
        const data = sheet.getDataRange().getValues();
        return this.dataToObjects(data);
    }

    /**
     * Gets column index by header name
     * @param {Array} headers - Array of header names
     * @param {string} columnName - Name of column to find
     * @returns {number} Index of column (-1 if not found)
     */
    getColumnIndex(headers, columnName) {
        return headers.findIndex(header =>
            header.toString().toLowerCase() === columnName.toLowerCase()
        );
    }

    /**
     * Checks if a product exists in PVPV_Export by UPC
     * @param {string} upc - UPC to search for
     * @returns {boolean} True if product exists
     */
    productExistsInPVPV(upc) {
        const pvpvProducts = this.getPVPVProducts();
        const upcCol = this.getColumnIndex(Object.keys(pvpvProducts[0]), 'upc');
        return pvpvProducts.some(product => product[upcCol] === upc);
    }

    /**
     * Updates a product in the Compiled sheet
     * @param {Object} product - Product data to update
     * @param {string} identifierColumn - Column to use for identifying the product
     */
    updateCompiledProduct(product, identifierColumn) {
        const sheet = this.getSheet('Compiled');
        const data = sheet.getDataRange().getValues();
        const headers = data[0];

        const idColIndex = this.getColumnIndex(headers, identifierColumn);
        if (idColIndex === -1) {
            throw new Error(`Column ${identifierColumn} not found`);
        }

        const rowIndex = data.findIndex((row, index) =>
            index > 0 && row[idColIndex] === product[identifierColumn]
        );

        if (rowIndex === -1) {
            // Add new row if product doesn't exist
            const newRow = headers.map(header => product[header] || '');
            sheet.appendRow(newRow);
        } else {
            // Update existing row
            headers.forEach((header, colIndex) => {
                if (product[header] !== undefined) {
                    sheet.getRange(rowIndex + 1, colIndex + 1).setValue(product[header]);
                }
            });
        }
    }
}
