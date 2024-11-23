/**
 * Gets all script properties and logs them to the console
 * Useful for managing database connection properties
 */
function getAllScriptProperties() {
  try {
    // Get script properties store
    const scriptProperties = PropertiesService.getScriptProperties();
    
    // Get all properties
    const properties = scriptProperties.getProperties();
    
    // Array to store formatted property strings
    const propertyList = [];
    
    // Database related properties to look for
    const dbProps = [
      'fg_db_host',
      'fg_db_port',
      'fg_db_name',
      'fg_db_username',
      'fg_db_password',
      'sb_db_host',
      'sb_db_port', 
      'sb_db_name',
      'sb_db_username',
      'jsb_db_password'
    ];
    
    // First process DB properties in specific order
    dbProps.forEach(prop => {
      if (properties[prop]) {
        propertyList.push(`${prop}: ${properties[prop]}`);
        delete properties[prop];
      } else {
        propertyList.push(`${prop}: not set`);
      }
    });
    
    // Then add any remaining properties
    Object.keys(properties).sort().forEach(key => {
      propertyList.push(`${key}: ${properties[key]}`);
    });
    
    // Log all properties
    Logger.log('Script Properties:');
    propertyList.forEach(prop => Logger.log(prop));
    
    return propertyList;
    
  } catch (error) {
    Logger.log('Error getting script properties: ' + error.toString());
    throw new Error('Failed to get script properties: ' + error.toString());
  }
}