// File: Menu.js
// Handles Google Sheets custom menu setup and configuration

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu('Amazon SP-API')

        // Reports submenu
        .addSubMenu(ui.createMenu('Reports')
            .addItem('Get FBA Inventory Planning', 'runFBAInventoryPlanning')
            .addItem('Get FBA Fees Report', 'testFBAFeesReport')
            .addItem('Get Seller Inventory', 'runSellerReport')
            .addItem('Get Order History', 'runOrderHistory')
            .addSeparator()
            .addItem('Pull Historical Orders', 'runHistoricalPull'))

        // Settings submenu
        .addSubMenu(ui.createMenu('Settings')
            .addItem('Verify Secrets', 'verifySecrets')
            .addItem('Display Redacted Secrets', 'displayRedactedSecrets')
            .addItem('Clear Token Cache', 'clearTokenCache'))

        // Report Tracking submenu
        .addSubMenu(ui.createMenu('Report Tracking')
            .addItem('Initialize Report Tracker', 'initializeReportTracker'))

        // Backup submenu
        .addSubMenu(ui.createMenu('Backup')
            .addItem('Setup Backup', 'setupBackup')
            .addItem('Run Backup Now', 'doFullBackup'));

    menu.addToUi();
}

/**
 * Helper function to show a modal alert
 * @param {string} message - The message to display
 * @param {string} title - Optional title for the alert
 */
function showAlert(message, title = 'Alert') {
    const ui = SpreadsheetApp.getUi();
    ui.alert(title, message, ui.ButtonSet.OK);
}

/**
 * Helper function to show a toast message
 * @param {string} message - The message to display
 * @param {string} title - Optional title for the toast
 * @param {number} timeout - Optional timeout in seconds
 */
function showToast(message, title = 'Status', timeout = 5) {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, title, timeout);
}

/**
 * Wrapper function to safely execute menu commands
 * @param {Function} fn - The function to execute
 * @param {string} actionName - Name of the action for error reporting
 */
function safeExecute(fn, actionName) {
    try {
        showToast(`Starting ${actionName}...`);
        fn();
        showToast(`${actionName} completed successfully!`);
    } catch (error) {
        Logger.log(`Error in ${actionName}: ${error}`);
        showAlert(`Error: ${error.message}`, `${actionName} Failed`);
    }
}

// Add wrapper functions for each menu action
function runFBAInventoryPlanning() {
    safeExecute(
        GET_FBA_INVENTORY_PLANNING_DATA,
        'FBA Inventory Planning Report'
    );
}