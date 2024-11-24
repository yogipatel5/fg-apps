 
 function getWHSConnection() {
  var url = "jdbc:mysql://wehandleship-db.ctflg9wovpkt.us-east-1.rds.amazonaws.com:3306/wehandleship";
  var user = "reporting102017";
  var password = "7pfAamQjBdJXWH1MsFDR";
  var maxRetries = 3; // maximum number of retries
  var conn = null;
  var retries = 0;

  while (retries < maxRetries) {
    try {
      conn = Jdbc.getConnection(url, user, password);
      break; // connection successful, exit loop
    } catch (e) {
      retries++;
      Utilities.sleep(5000); // wait for 5 seconds before retrying
    }
  }

  if (conn == null) {
    throw new Error("Failed to establish database connection.");
  }

  return conn;
}

function getProductConnection() {
  var url = "jdbc:mysql://35.208.223.164:3306/dblvbaqgegqa9h";
  var user = "uw3wisgzfgb6d";
  var password = "@rlFggDuF27o7";
  var maxRetries = 3; // maximum number of retries
  var conn = null;
  var retries = 0;

  while (retries < maxRetries) {
    try {
      conn = Jdbc.getConnection(url, user, password);
      break; // connection successful, exit loop
    } catch (e) {
      retries++;
      Utilities.sleep(5000); // wait for 5 seconds before retrying
    }
  }

  if (conn == null) {
    throw new Error("Failed to establish database connection.");
  }

  return conn;
}

// Function to execute a SELECT query and return the result set
function executeSelectQuery(conn, query) {
  var stmt = conn.createStatement();
  var rs = stmt.executeQuery(query);
  return rs;
}

function prepareUpdateStatement(conn, query) {
  var stmt = conn.prepareStatement(query);
  return stmt;
}

function mysqlQueryToObject() {
  // Replace the variables below with your own database credentials and query
  var query = "SELECT * FROM products where products.sku = 'COMBOPACK'";
  
  // Connect to the database
  var connection = getProductConnection();
  var statement = connection.createStatement();
  
  // Execute the query and retrieve the results
  var resultSet = statement.executeQuery(query);
  
  // Convert the results to a JavaScript object
  var data = [];
  var columns = [];
  var columnCount = resultSet.getMetaData().getColumnCount();
  
  while (resultSet.next()) {
    var row = {};
    
    // Save column names for first row
    if (data.length == 0) {
      for (var i = 1; i <= columnCount; i++) {
        columns.push(resultSet.getMetaData().getColumnName(i));
      }
    }
    
    for (var i = 1; i <= columnCount; i++) {
      row[columns[i-1]] = resultSet.getString(i);
    }
    
    data.push(row);
  }
  
  // Close the database connection
  resultSet.close();
  statement.close();
  connection.close();
  
  // Log the resulting object to the console
  Logger.log(data[0].sunset);
  var data = [{sunset:null, msrp:51.99, width_inch:2.25, length_inch:9.00, internal_type:"bundle", weight_oz:24.37, parent_upc:null, name:"Classic", cost:5.52, product_type:"Combo Pack", units:4, inventory_available:2759, upc:811207024245, enabled:1, est_us_sh_price:8.41, height_inch:4.75, sku:"COMBOPACK", title:"Classic Combo Pack (4 Set)", size:"4 Set"}];

var obj = data[0];
Logger.log(obj.sunset)
}

