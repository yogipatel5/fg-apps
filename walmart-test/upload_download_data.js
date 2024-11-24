 
 function downloadData() {
  var conn = getProductConnection();
  // Download data from products table
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('products') || SpreadsheetApp.getActiveSpreadsheet().createSheet('products');
  var stmt = conn.createStatement();
  var rs = stmt.executeQuery('SELECT * FROM products');
  var data = [];
  while (rs.next()) {
    
    var row = [];
    for (var i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
      Logger.log (rs.getString(i));
      row.push(rs.getString(i));
    }
    data.push(row);
  }
  rs.close();
  stmt.close();
  sheet.getRange(1, 2, data.length, data[0].length).setValues(data);
  
  // Download data from product_medias table
  // Repeat the above code for each table
  
  conn.close();
}

function uploadData() {
  var conn = Jdbc.getConnection("jdbc:mysql://your_mysql_host:3306/your_database_name", "username", "password");
  
  // Upload data to products table
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('products');
  var data = sheet.getDataRange().getValues();
  var stmt = conn.prepareStatement('DELETE FROM products');
  stmt.executeUpdate();
  stmt.close();
  stmt = conn.prepareStatement('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (var i = 1; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      stmt.setString(j + 1, data[i][j]);
    }
    stmt.addBatch();
  }
  stmt.executeBatch();
  stmt.close();
  
  // Upload data to product_medias table
  // Repeat the above code for each table
  
  conn.close();
}
