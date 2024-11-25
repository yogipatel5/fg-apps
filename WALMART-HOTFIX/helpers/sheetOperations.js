/**
 * Helper class for sheet operations with dynamic column handling
 */
class SheetOperations {
    /**
     * Initialize with a sheet
     * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to operate on
     */
    constructor(sheet) {
        this.sheet = sheet;
        this.data = sheet.getDataRange().getValues();
        this.headers = this.data[0];
        this.headerMap = this._createHeaderMap();
    }

    /**
     * Creates a map of header names to column indices
     * @private
     * @returns {Object} Map of header names to column indices
     */
    _createHeaderMap() {
        const map = {};
        this.headers.forEach((header, index) => {
            map[header.trim()] = index;
        });
        return map;
    }

    /**
     * Gets the column index for a header name
     * @param {string} headerName - The name of the header
     * @returns {number} The column index (0-based) or -1 if not found
     */
    getColumnIndex(headerName) {
        return this.headerMap[headerName] ?? -1;
    }

    /**
     * Updates a single cell value
     * @param {number} rowIndex - The row index (1-based)
     * @param {string} headerName - The column header name
     * @param {any} value - The value to set
     * @returns {boolean} Success status
     */
    updateCell(rowIndex, headerName, value) {
        const colIndex = this.getColumnIndex(headerName);
        if (colIndex === -1) {
            console.error(`Column ${headerName} not found`);
            return false;
        }
        try {
            this.sheet.getRange(rowIndex, colIndex + 1).setValue(value);
            return true;
        } catch (error) {
            console.error(`Error updating cell: ${error.message}`);
            return false;
        }
    }

    /**
     * Gets a value from a specific cell
     * @param {number} rowIndex - The row index (1-based)
     * @param {string} headerName - The column header name
     * @returns {any} The cell value or null if not found
     */
    getCellValue(rowIndex, headerName) {
        const colIndex = this.getColumnIndex(headerName);
        if (colIndex === -1 || rowIndex > this.data.length) {
            return null;
        }
        return this.data[rowIndex - 1][colIndex];
    }

    /**
     * Updates multiple columns in a single row
     * @param {number} rowIndex - The row index (1-based)
     * @param {Object} updates - Object with header names as keys and values to set
     * @returns {Object} Summary of updates
     */
    updateRow(rowIndex, updates) {
        const summary = {
            successful: [],
            failed: []
        };

        Object.entries(updates).forEach(([header, value]) => {
            const success = this.updateCell(rowIndex, header, value);
            if (success) {
                summary.successful.push(header);
            } else {
                summary.failed.push(header);
            }
        });

        return summary;
    }

    /**
     * Finds a row index by matching a value in a specific column
     * @param {string} headerName - The column header name
     * @param {any} value - The value to match
     * @returns {number} The row index (1-based) or -1 if not found
     */
    findRowIndex(headerName, value) {
        const colIndex = this.getColumnIndex(headerName);
        if (colIndex === -1) return -1;

        for (let i = 1; i < this.data.length; i++) {
            if (this.data[i][colIndex] === value) {
                return i + 1; // Convert to 1-based index
            }
        }
        return -1;
    }
} 