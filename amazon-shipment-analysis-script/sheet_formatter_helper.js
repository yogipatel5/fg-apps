/**
 * Standard column format types with predefined formats, validations, and alignments
 * @constant {Object}
 */
const ColumnFormats = {
    DATE: {
        format: 'mm/dd/yyyy',
        validate: 'date',
        align: 'center'
    },
    DATETIME: {
        format: 'mm/dd/yyyy hh:mm:ss',
        validate: 'date',
        align: 'center'
    },
    MONEY: {
        format: '$#,##0.00',
        validate: 'number',
        align: 'right'
    },
    PERCENTAGE: {
        format: '0.00%',
        validate: 'number',
        align: 'right'
    },
    INTEGER: {
        format: '#,##0',
        validate: 'number',
        align: 'right'
    },
    DECIMAL: {
        format: '#,##0.00',
        validate: 'number',
        align: 'right'
    },
    TEXT: {
        format: '@',
        validate: 'text',
        align: 'left'
    },
    EMAIL: {
        format: '@',
        validate: 'email',
        align: 'left'
    },
    PHONE: {
        format: '@',
        validate: 'phone',
        align: 'left'
    }
};

/**
 * Clears a sheet's content, formatting, filters, and conditional formatting rules
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {string} sheetName - Name of the sheet to clear
 * @returns {SpreadsheetApp.Sheet|null} - The cleared sheet or null if not found
 */
function clearSheet(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        console.warn(`Sheet "${sheetName}" not found`);
        return null;
    }

    // Remove any existing filters
    const filter = sheet.getFilter();
    if (filter) {
        filter.remove();
    }

    // Remove all conditional formatting rules
    sheet.clearConditionalFormatRules();

    // Clear all content and formatting
    sheet.clear();
    sheet.clearFormats();

    return sheet;
}

/**
 * Writes data to a sheet with comprehensive formatting options
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {Object} options - Configuration options
 * @param {string} options.sheetName - Name of the target sheet
 * @param {string[]} options.headers - Array of column headers
 * @param {Array<Array>} options.data - 2D array of data to write
 * @param {boolean} [options.clearFirst=true] - Whether to clear sheet before writing
 * @param {boolean} [options.createIfMissing=true] - Whether to create sheet if it doesn't exist
 * @param {Object} [options.columnFormats] - Number formats for specific columns
 * @param {Object} [options.columnWidths] - Width settings for specific columns
 * @param {boolean} [options.addFilter=true] - Whether to add filter to headers
 * @param {Object} [options.frozen] - Frozen rows/columns configuration
 * @returns {SpreadsheetApp.Sheet|null} - The modified sheet or null if operation failed
 */
function writeDataToSheet(ss, options) {
    const {
        sheetName,
        headers,
        data,
        clearFirst = true,
        createIfMissing = true,
        columnFormats,
        columnWidths,
        addFilter = true,
        frozen = { rows: 1 }
    } = options;

    // Get or create sheet
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet && createIfMissing) {
        sheet = ss.insertSheet(sheetName);
    } else if (!sheet) {
        console.error(`Sheet "${sheetName}" not found and createIfMissing is false`);
        return null;
    }

    // Clear if requested
    if (clearFirst) {
        clearSheet(ss, sheetName);
    }

    // Prepare data array with headers
    const fullData = [headers].concat(data);

    // Write data
    const range = sheet.getRange(1, 1, fullData.length, headers.length);
    range.setValues(fullData);

    // Apply column formats if provided
    if (columnFormats) {
        Object.entries(columnFormats).forEach(([col, format]) => {
            if (data.length > 0) {
                sheet.getRange(2, parseInt(col), data.length, 1)
                    .setNumberFormat(format);
            }
        });
    }

    // Set column widths if provided
    if (columnWidths) {
        Object.entries(columnWidths).forEach(([col, width]) => {
            sheet.setColumnWidth(parseInt(col), width);
        });
    }

    // Add filter if requested
    if (addFilter) {
        sheet.getRange(1, 1, fullData.length, headers.length).createFilter();
    }

    // Freeze rows/columns
    if (frozen.rows) sheet.setFrozenRows(frozen.rows);
    if (frozen.columns) sheet.setFrozenColumns(frozen.columns);

    return sheet;
}

/**
 * Applies standard sheet formatting including headers and borders
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @returns {void}
 */
function formatSheet(ss) {
    const sheet = ss.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    // Set default font and size
    sheet.getRange(1, 1, lastRow, lastCol)
        .setFontFamily("Arial")
        .setFontSize(10);

    // Format header row
    sheet.getRange(1, 1, 1, lastCol)
        .setFontWeight("bold")
        .setBackground("#f3f3f3")
        .setHorizontalAlignment("center")
        .setBorder(true, true, true, true, true, true);

    // Format data range
    sheet.getRange(2, 1, lastRow - 1, lastCol)
        .setBorder(true, true, true, true, true, true);
}

/**
 * Applies alternating row colors starting from specified row
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {number} [startRow=2] - Row to start alternating colors from
 * @returns {void}
 */
function alternateRowColor(ss, startRow = 2) {
    const sheet = ss.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    for (let i = startRow; i <= lastRow; i++) {
        if (i % 2 === 0) {
            sheet.getRange(i, 1, 1, lastCol).setBackground("#f8f9fa");
        } else {
            sheet.getRange(i, 1, 1, lastCol).setBackground("#ffffff");
        }
    }
}

/**
 * Sets column alignments and number formats
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {Object} columnFormats - Format settings per column
 * @param {string} [columnFormats.align] - Horizontal alignment
 * @param {string} [columnFormats.format] - Number format pattern
 * @returns {void}
 */
function alignColumns(ss, columnFormats) {
    const sheet = ss.getActiveSheet();
    const lastRow = sheet.getLastRow();

    Object.entries(columnFormats).forEach(([col, settings]) => {
        const range = sheet.getRange(2, parseInt(col), lastRow - 1, 1);
        if (settings.align) {
            range.setHorizontalAlignment(settings.align);
        }
        if (settings.format) {
            range.setNumberFormat(settings.format);
        }
    });
}

/**
 * Hides specified columns in the active sheet
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {number[]} columnsToHide - Array of column numbers to hide
 * @returns {void}
 */
function hideColumns(ss, columnsToHide) {
    const sheet = ss.getActiveSheet();
    columnsToHide.forEach(col => {
        sheet.hideColumns(col);
    });
}

/**
 * Sets column widths for specified columns
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {Object.<number, number>} widthsMap - Map of column numbers to widths
 * @returns {void}
 */
function setColumnWidths(ss, widthsMap) {
    const sheet = ss.getActiveSheet();
    Object.entries(widthsMap).forEach(([col, width]) => {
        sheet.setColumnWidth(parseInt(col), width);
    });
}

/**
 * Applies conditional formatting rules to the sheet
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {Array<Object>} rules - Array of conditional formatting rules
 * @param {string} rules[].type - Rule type (TEXT_EQ, NUMBER_LESS, etc.)
 * @param {Array} rules[].values - Values for the rule
 * @param {string} rules[].background - Background color to apply
 * @param {Range} rules[].range - Range to apply the rule to
 * @returns {void}
 */
function setConditionalFormatting(ss, rules) {
    const sheet = ss.getActiveSheet();

    // Clear existing rules
    sheet.clearConditionalFormatRules();

    const newRules = rules.map(rule => {
        let formatRule;

        switch (rule.type) {
            case "TEXT_EQ":
                formatRule = SpreadsheetApp.newConditionalFormatRule()
                    .whenTextEqualTo(rule.values[0])
                    .setBackground(rule.background);
                break;
            case "NUMBER_LESS":
                formatRule = SpreadsheetApp.newConditionalFormatRule()
                    .whenNumberLessThan(rule.values[0])
                    .setBackground(rule.background);
                break;
            case "NUMBER_GREATER":
                formatRule = SpreadsheetApp.newConditionalFormatRule()
                    .whenNumberGreaterThan(rule.values[0])
                    .setBackground(rule.background);
                break;
            case "CUSTOM_FORMULA":
                formatRule = SpreadsheetApp.newConditionalFormatRule()
                    .whenFormulaSatisfied(rule.formula)
                    .setBackground(rule.background);
                break;
        }

        return formatRule.setRanges([rule.range]).build();
    });

    sheet.setConditionalFormatRules(newRules);
}

/**
 * Sets row heights for specified rows
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {Object.<number, number>} rowHeights - Map of row numbers to heights
 * @returns {void}
 */
function setRowHeights(ss, rowHeights) {
    const sheet = ss.getActiveSheet();
    Object.entries(rowHeights).forEach(([row, height]) => {
        sheet.setRowHeight(parseInt(row), height);
    });
}

/**
 * Adds or replaces filter in the active sheet
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @returns {void}
 */
function addFilter(ss) {
    const sheet = ss.getActiveSheet();
    const existingFilter = sheet.getFilter();
    if (existingFilter) {
        existingFilter.remove();
    }
    sheet.getDataRange().createFilter();
}

/**
 * Applies data validation to a range
 * @param {Range} range - The range to apply validation to
 * @param {string} validationType - Type of validation to apply
 * @param {Object} [options] - Additional validation options
 * @param {number} [options.min] - Minimum value for number validation
 * @param {number} [options.max] - Maximum value for number validation
 * @param {string[]} [options.values] - Valid values for list validation
 * @returns {void}
 */
function applyValidation(range, validationType, options = {}) {
    let rule;

    switch (validationType) {
        case 'date':
            rule = SpreadsheetApp.newDataValidation()
                .requireDate()
                .setAllowInvalid(false)
                .setHelpText('Please enter a valid date');
            break;

        case 'number':
            rule = SpreadsheetApp.newDataValidation()
                .requireNumberGreaterThan(options.min || Number.NEGATIVE_INFINITY)
                .requireNumberLessThan(options.max || Number.POSITIVE_INFINITY)
                .setAllowInvalid(false)
                .setHelpText('Please enter a valid number');
            break;

        case 'email':
            rule = SpreadsheetApp.newDataValidation()
                .requireTextIsEmail()
                .setAllowInvalid(false)
                .setHelpText('Please enter a valid email address');
            break;

        case 'phone':
            rule = SpreadsheetApp.newDataValidation()
                .requireTextMatchesPattern('^[0-9-+()\\s]{10,}$')
                .setAllowInvalid(false)
                .setHelpText('Please enter a valid phone number');
            break;

        case 'list':
            if (options.values) {
                rule = SpreadsheetApp.newDataValidation()
                    .requireValueInList(options.values, true)
                    .setAllowInvalid(false)
                    .setHelpText(`Please select from: ${options.values.join(', ')}`);
            }
            break;
    }

    if (rule) {
        range.setDataValidation(rule);
    }
}

/**
 * Applies standard formatting with predefined column types
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @param {Object} options - Formatting options
 * @param {string} options.sheetName - Name of the sheet to format
 * @param {string[]} options.headers - Array of column headers
 * @param {Object.<number, string>} options.columnTypes - Map of column indices to ColumnFormats types
 * @param {Object} [options.additionalFormats] - Custom formats for specific columns
 * @param {Object} [options.headerStyle] - Style options for header row
 * @returns {SpreadsheetApp.Sheet|null} - The formatted sheet or null if not found
 */
function applyStandardFormatting(ss, options) {
    const {
        sheetName,
        headers,
        columnTypes,
        additionalFormats = {},
        headerStyle = {
            background: '#f3f3f3',
            fontWeight: 'bold',
            fontSize: 10,
            fontFamily: 'Arial',
            border: true
        }
    } = options;

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        console.error(`Sheet "${sheetName}" not found`);
        return null;
    }

    const lastRow = sheet.getLastRow();
    const lastCol = headers.length;

    // Apply header styling
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    if (headerStyle.background) headerRange.setBackground(headerStyle.background);
    if (headerStyle.fontWeight) headerRange.setFontWeight(headerStyle.fontWeight);
    if (headerStyle.fontSize) headerRange.setFontSize(headerStyle.fontSize);
    if (headerStyle.fontFamily) headerRange.setFontFamily(headerStyle.fontFamily);
    if (headerStyle.border) {
        headerRange.setBorder(true, true, true, true, true, true);
    }

    // Apply column formats and validation
    headers.forEach((header, index) => {
        const colIndex = index + 1;
        const columnType = columnTypes[colIndex];
        const customFormat = additionalFormats[colIndex];

        if (columnType && ColumnFormats[columnType]) {
            const format = ColumnFormats[columnType];
            const range = sheet.getRange(2, colIndex, lastRow - 1, 1);
            range.setNumberFormat(format.format);
            range.setHorizontalAlignment(format.align);
            if (format.validate) {
                applyValidation(range, format.validate);
            }
        } else if (customFormat) {
            const range = sheet.getRange(2, colIndex, lastRow - 1, 1);
            if (customFormat.format) range.setNumberFormat(customFormat.format);
            if (customFormat.align) range.setHorizontalAlignment(customFormat.align);
            if (customFormat.validate) applyValidation(range, customFormat.validate);
        }
    });

    return sheet;
}

/**
 * Example usage for formatting FBA inventory sheet
 * @param {SpreadsheetApp.Spreadsheet} ss - The spreadsheet object
 * @returns {SpreadsheetApp.Sheet} - The formatted sheet
 */
function formatFBAInventorySheet(ss) {
    const headers = [
        'Priority Number',
        'Sales Priority',
        'Daily Avg Sales',
        // ... rest of headers
    ];

    const columnTypes = {
        1: 'INTEGER',           // Priority Number
        3: 'MONEY',            // Daily Avg Sales
        // ... rest of column types
    };

    const additionalFormats = {
        2: {                   // Sales Priority
            validate: 'list',
            values: ['High', 'Medium', 'Low']
        },
        // ... rest of additional formats
    };

    return applyStandardFormatting(ss, {
        sheetName: 'FBA Inventory Analysis',
        headers: headers,
        columnTypes: columnTypes,
        additionalFormats: additionalFormats,
        headerStyle: {
            background: '#f3f3f3',
            fontWeight: 'bold',
            fontSize: 10,
            fontFamily: 'Arial',
            border: true
        }
    });
}

/**
 * Adds a note to a specific cell
 * @param {SpreadsheetApp.Range} cell - The cell to add the note to
 * @param {string} note - The note text to add
 * @param {boolean} [append=false] - Whether to append to existing note or replace
 * @returns {void}
 */
function addNoteToCell(cell, note, append = false) {
    const existingNote = cell.getNote();
    if (append && existingNote) {
        cell.setNote(`${existingNote}\n${note}`);
    } else {
        cell.setNote(note);
    }
}

/**
 * Finds a cell by header and value and adds a note
 * @param {SpreadsheetApp.Sheet} sheet - The sheet to search in
 * @param {string} headerName - The column header to search under
 * @param {string|number} searchValue - The value to search for
 * @param {string} note - The note to add
 * @param {boolean} [append=false] - Whether to append to existing note
 * @param {boolean} [exactMatch=true] - Whether to require exact match
 * @returns {boolean} - Whether the cell was found and note was added
 */
function addNoteByCellLookup(sheet, headerName, searchValue, note, append = false, exactMatch = true) {
    // Get all data
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return false; // Need at least headers and one data row

    // Find header column
    const headers = data[0];
    const colIndex = headers.findIndex(header =>
        exactMatch ? header === headerName : header.toString().toLowerCase().includes(headerName.toLowerCase())
    );

    if (colIndex === -1) return false;

    // Find matching row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        const cellValue = data[i][colIndex];
        if (exactMatch) {
            if (cellValue === searchValue) {
                rowIndex = i;
                break;
            }
        } else {
            if (cellValue.toString().toLowerCase().includes(searchValue.toString().toLowerCase())) {
                rowIndex = i;
                break;
            }
        }
    }

    if (rowIndex === -1) return false;

    // Add note to found cell
    const cell = sheet.getRange(rowIndex + 1, colIndex + 1);
    addNoteToCell(cell, note, append);
    return true;
}

/**
 * Adds notes to multiple cells matching criteria
 * @param {SpreadsheetApp.Sheet} sheet - The sheet to search in
 * @param {string} headerName - The column header to search under
 * @param {Array<Object>} notesData - Array of search values and notes
 * @param {string|number} notesData[].searchValue - Value to search for
 * @param {string} notesData[].note - Note to add
 * @param {boolean} [append=false] - Whether to append to existing notes
 * @returns {number} - Number of cells where notes were added
 */
function addMultipleNotes(sheet, headerName, notesData, append = false) {
    let notesAdded = 0;
    notesData.forEach(({ searchValue, note }) => {
        if (addNoteByCellLookup(sheet, headerName, searchValue, note, append)) {
            notesAdded++;
        }
    });
    return notesAdded;
}

/**
 * Clears notes from specified range
 * @param {SpreadsheetApp.Sheet} sheet - The sheet containing the range
 * @param {string} rangeA1Notation - Range in A1 notation
 * @returns {void}
 */
function clearNotesInRange(sheet, rangeA1Notation) {
    const range = sheet.getRange(rangeA1Notation);
    range.clearNote();
}
