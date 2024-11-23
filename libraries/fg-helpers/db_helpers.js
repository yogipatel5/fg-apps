class FgSQL {
  constructor() {
    const scriptProps = PropertiesService.getScriptProperties();
    this.server = scriptProps.getProperty('fg_db_host');
    this.port = scriptProps.getProperty('fg_db_port');
    this.dbName = scriptProps.getProperty('fg_db_name');
    this.username = scriptProps.getProperty('fg_db_username');
    this.password = scriptProps.getProperty('fg_db_password');
    this.url = "jdbc:mysql://" + this.server + ":" + this.port + "/" + this.dbName;
    Logger.log('FG Connection URL:', this.url);
  }

  query(sql) {
    try {
      const start = new Date();
      Logger.log('Executing FG query:', sql);
      
      Logger.log('Attempting FG connection...');
      const conn = Jdbc.getConnection(this.url, this.username, this.password);
      Logger.log('FG Connection established');
      
      Logger.log('Creating statement...');
      const stmt = conn.createStatement();
      Logger.log('Statement created');
      
      Logger.log('Executing query...');
      const results = stmt.executeQuery(sql);
      Logger.log('Query executed');
      
      Logger.log('Getting metadata...');
      const metadata = results.getMetaData();
      const numCols = metadata.getColumnCount();
      Logger.log('Number of columns:', numCols);
      
      // Log column names
      const columnNames = [];
      for (let i = 1; i <= numCols; i++) {
        columnNames.push(metadata.getColumnName(i));
      }
      Logger.log('Column names:', columnNames);
      
      const arr = [];
      Logger.log('Starting to fetch rows...');
      let rowCount = 0;
      
      while (results.next()) {
        let row = [];
        for (var col = 0; col < numCols; col++) {
          const value = results.getString(col + 1);
          row.push(value);
        }
        arr.push(row);
        rowCount++;
        if (rowCount % 10 === 0) {
          Logger.log(`Processed ${rowCount} rows...`);
        }
      }
      
      Logger.log('Closing results...');
      results.close();
      Logger.log('Closing statement...');
      stmt.close();
      Logger.log('Closing connection...');
      conn.close();
      
      const end = new Date();
      Logger.log(`FG Query completed in ${(end - start) / 1000} seconds`);
      Logger.log(`Total rows returned: ${arr.length}`);
      if (arr.length > 0) {
        Logger.log('First row:', JSON.stringify(arr[0]));
      } else {
        Logger.log('No rows returned');
      }
      Logger.log('Full results:', JSON.stringify(arr, null, 2));
      
      return arr;
    } catch (error) {
      Logger.log('Error in FG query:', error.toString());
      Logger.log('Error stack:', error.stack);
      throw error;
    }
  }
}

class SbSQL {
  constructor() {
    this.server = "wehandleship-db.ctflg9wovpkt.us-east-1.rds.amazonaws.com";
    this.port = 3306;
    this.dbName = "wehandleship";
    this.username = "reporting102017";
    this.password = "7pfAamQjBdJXWH1MsFDR";
    this.url = "jdbc:mysql://" + this.server + ":" + this.port + "/" + this.dbName;
    Logger.log('SB Connection URL:', this.url);
  }

  query(sql) {
    try {
      const start = new Date();
      Logger.log('Executing SB query:', sql);
      
      Logger.log('Attempting SB connection...');
      const conn = Jdbc.getConnection(this.url, this.username, this.password);
      Logger.log('SB Connection established');
      
      Logger.log('Creating statement...');
      const stmt = conn.createStatement();
      Logger.log('Statement created');
      
      Logger.log('Executing query...');
      const results = stmt.executeQuery(sql);
      Logger.log('Query executed');
      
      Logger.log('Getting metadata...');
      const metadata = results.getMetaData();
      const numCols = metadata.getColumnCount();
      Logger.log('Number of columns:', numCols);
      
      // Log column names
      const columnNames = [];
      for (let i = 1; i <= numCols; i++) {
        columnNames.push(metadata.getColumnName(i));
      }
      Logger.log('Column names:', columnNames);
      
      const arr = [];
      Logger.log('Starting to fetch rows...');
      let rowCount = 0;
      
      while (results.next()) {
        let row = [];
        for (var col = 0; col < numCols; col++) {
          const value = results.getString(col + 1);
          row.push(value);
        }
        arr.push(row);
        rowCount++;
        if (rowCount % 10 === 0) {
          Logger.log(`Processed ${rowCount} rows...`);
        }
      }
      
      Logger.log('Closing results...');
      results.close();
      Logger.log('Closing statement...');
      stmt.close();
      Logger.log('Closing connection...');
      conn.close();
      
      const end = new Date();
      Logger.log(`SB Query completed in ${(end - start) / 1000} seconds`);
      Logger.log(`Total rows returned: ${arr.length}`);
      if (arr.length > 0) {
        Logger.log('First row:', JSON.stringify(arr[0]));
      } else {
        Logger.log('No rows returned');
      }
      Logger.log('Full results:', JSON.stringify(arr, null, 2));
      
      return arr;
    } catch (error) {
      Logger.log('Error in SB query:', error.toString());
      Logger.log('Error stack:', error.stack);
      throw error;
    }
  }
}

/**
 * Test querying orders from both databases
 */
function testOrdersQuery() {
  try {
    Logger.log('\n=== Testing FG Orders ===');
    const fg = new FgSQL();
    const fgResults = fg.query('SELECT * FROM orders LIMIT 10');
    Logger.log('FG Test completed. Total rows:', fgResults.length);
  } catch (error) {
    Logger.log('Error in FG test:', error.toString());
  }
  
  try {
    Logger.log('\n=== Testing SB Orders ===');
    const sb = new SbSQL();
    const sbResults = sb.query('SELECT * FROM orders LIMIT 10');
    Logger.log('SB Test completed. Total rows:', sbResults.length);
  } catch (error) {
    Logger.log('Error in SB test:', error.toString());
  }
}