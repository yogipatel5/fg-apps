function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Inventory Tools')
    .addItem('1. Breakdown Combo to Individual', 'breakdownInventoryNeeds')
    .addItem('2. Analyze Fulfillment Capability', 'analyzeFulfillment')
    .addItem('3. Create Warehouse Shipment Request', 'createWarehouseShipmentRequest')
    .addItem('Export All Sheets to CSV', 'exportSheetsToCSV')
    .addItem('Internal-ProcessAmazonReport', 'processAmazonFBAReportWithAmazonPriority')
    .addToUi();
}