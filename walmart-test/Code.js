function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('DB-OPS')
      .addItem('Pull Products', 'getProducts')
      .addItem('Pull Product Identifiers', 'getProductIdentifiers')
      .addSubMenu(ui.createMenu('Inventory')
          .addItem('Update DB Inventory', 'updateSQLInventory')
          .addItem('Update Walmart Inventory', 'updateWalmartInventory')
          .addItem('Pull Walmart Inventory', 'pullWalmartInventory'))  // Add this line
      .addSubMenu(ui.createMenu('Product Data')
          .addItem('Download Data', 'downloadData')
          .addItem('Upload Data', 'uploadData'))
      .addToUi()
}

function getProducts() {
  var conn = Jdbc.getConnection("jdbc:mysql://35.208.223.164:3306/dblvbaqgegqa9h", "uw3wisgzfgb6d", "@rlFggDuF27o7");
  var stmt = conn.createStatement();
  var rs = stmt.executeQuery("SELECT * FROM products");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  var headers = rs.getMetaData();
  var headerArray = [];
  for (var i = 1; i <= headers.getColumnCount(); i++) {
    headerArray.push(headers.getColumnName(i));
  }
  sheet.getRange(1, 1, 1, headers.getColumnCount()).setValues([headerArray]);
  var data = [];
  while (rs.next()) {
    var row = [];
    for (var i = 1; i <= headers.getColumnCount(); i++) {
      row.push(rs.getString(i));
    }
    data.push(row);
  }
  sheet.getRange(2, 1, data.length, headers.getColumnCount()).setValues(data);
  rs.close();
  stmt.close();
  conn.close();
} 


function getProductIdentifiers() {
  var conn = Jdbc.getConnection("jdbc:mysql://35.208.223.164:3306/dblvbaqgegqa9h", "uw3wisgzfgb6d", "@rlFggDuF27o7");
  var stmt = conn.createStatement();
  var rs = stmt.executeQuery("SELECT * FROM product_identifiers");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Product Identifiers');
  var headers = rs.getMetaData();
  var headerArray = [];
  for (var i = 1; i <= headers.getColumnCount(); i++) {
    headerArray.push(headers.getColumnName(i));
  }
  sheet.getRange(1, 1, 1, headers.getColumnCount()).setValues([headerArray]);
  var data = [];
  while (rs.next()) {
    var row = [];
    for (var i = 1; i <= headers.getColumnCount(); i++) {
      row.push(rs.getString(i));
    }
    data.push(row);
  }
  sheet.getRange(2, 1, data.length, headers.getColumnCount()).setValues(data);
  rs.close();
  stmt.close();
  conn.close();
  getProducts();
}