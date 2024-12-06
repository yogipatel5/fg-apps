function initializeConstants() {
    // If ColumnFormats is already defined, don't redefine it
    if (typeof globalThis.ColumnFormats === 'undefined') {
        globalThis.ColumnFormats = {
            DATE: {
                format: "mm/dd/yyyy",
                validate: "date",
                align: "center",
            },
            DATETIME: {
                format: "mm/dd/yyyy hh:mm:ss",
                validate: "date",
                align: "center",
            },
            MONEY: {
                format: "$#,##0.00",
                validate: "number",
                align: "right",
            },
            PERCENTAGE: {
                format: "0.00%",
                validate: "number",
                align: "right",
            },
            INTEGER: {
                format: "#,##0",
                validate: "number",
                align: "right",
            },
            DECIMAL: {
                format: "#,##0.00",
                validate: "number",
                align: "right",
            },
            TEXT: {
                format: "@",
                validate: "text",
                align: "left",
            }
        };
    }
    return globalThis.ColumnFormats;
}

function initialize() {
    const constants = initializeConstants();
    // Add other initialization here if needed
    return {
        ColumnFormats: constants,
        // other initialized values...
    };
} 