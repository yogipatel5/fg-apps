function updateSQLInventory() {
  var whsConn = getWHSConnection();
  var otherConn = getProductConnection();

  try {
    whsConn.setAutoCommit(false);  // Begin transaction for warehouse DB if applicable
    otherConn.setAutoCommit(false); // Begin transaction for products DB

    var whsQuery = `
      SELECT inventories.upc as upc, available_for_sale 
      FROM stock_products 
      LEFT JOIN inventories 
      ON inventories.stock_product_id = stock_products.id 
      AND inventories.updated_at > now() - interval 12 hour 
      WHERE stock_products.merchant_id = 2 
      AND stock_products.enabled = 1 
      AND inventories.warehouse_id = 3 
      AND inventories.available_for_sale IS NOT NULL 
      ORDER BY inventories.updated_at DESC
    `;
    
    var whsRs = executeSelectQuery(whsConn, whsQuery);
    var otherQuery = "UPDATE products_new SET inventory_available = ? WHERE upc = ? and internal_type = 'single'";

    var otherStmt = prepareUpdateStatement(otherConn, otherQuery);
    
    var batchSize = 50;
    var count = 0;

    while (whsRs.next()) {
      var upc = whsRs.getString("upc");
      var availableForSale = whsRs.getString("available_for_sale");
      
      otherStmt.setString(1, availableForSale);
      otherStmt.setString(2, upc);
      otherStmt.addBatch();

      count++;

      if (count % batchSize === 0) { 
        otherStmt.executeBatch();
        otherConn.commit();  // Commit after each batch for safety
      }
    }
    otherStmt.executeBatch(); // Final batch execution
    otherConn.commit();
    
    updateBundleInventory();  // Update bundles after single items are updated

  } catch (error) {
    console.error("Error updating inventory:", error);
    otherConn.rollback();
    whsConn.rollback();
    return false;
  } finally {
    if (whsRs) whsRs.close();
    if (whsConn) whsConn.close();
    if (otherStmt) otherStmt.close();
    if (otherConn) otherConn.close();
  }

  return true;
}


// Update inventory from WHS to ProductsDB
// function updateSQLInventory() {
//   var whsConn = getWHSConnection();
//   var whsQuery = "SELECT inventories.upc as upc, available_for_sale FROM stock_products LEFT JOIN inventories ON inventories.stock_product_id = stock_products.id and inventories.updated_at > now() - interval 12 hour WHERE stock_products.merchant_id = 2 and stock_products.enabled = 1 and inventories.warehouse_id = 3 and inventories.available_for_sale is not null order by inventories.updated_at desc";
  
//   var whsRs = executeSelectQuery(whsConn, whsQuery);

//   var otherConn = getProductConnection();
//   var otherQuery = "UPDATE products SET inventory_available = ? WHERE upc = ? and internal_type = 'single'";
//   var otherStmt = prepareUpdateStatement(otherConn, otherQuery);

//   while (whsRs.next()) {
//     var upc = whsRs.getString("upc");
//     var availableForSale = whsRs.getString("available_for_sale");
    
//     otherStmt.setString(1, availableForSale);
//     otherStmt.setString(2, upc);
//     otherStmt.executeUpdate();
  
//   }
//   updateBundleInventory();
//   whsRs.close();
//   whsConn.close();
//   otherStmt.close();
//   otherConn.close();
//   return true
// }

// Based on Single Products - Update Bundle Skus based on Component Skus and Quantities
function updateBundleInventory() {
  var otherConn = getProductConnection();
  var otherQuery = "UPDATE products_new AS b JOIN( SELECT pb.bundle_upc, MIN(p.inventory_available / pb.quantity) AS bundles_available FROM product_bundles pb JOIN products p ON pb.component_upc = p.upc GROUP BY pb.bundle_upc) AS a ON a.bundle_upc = b.upc SET b.inventory_available = a.bundles_available WHERE b.internal_type in ('bundle','multi')";
  var otherStmt = prepareUpdateStatement(otherConn, otherQuery);
  otherStmt.executeUpdate();

  otherStmt.close();
  otherConn.close();
}

