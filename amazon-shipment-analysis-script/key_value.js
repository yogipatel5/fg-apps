function getConfigurationValues() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const valuesSheet = ss.getSheetByName('values');
  const data = valuesSheet.getDataRange().getValues();
  
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    const [key, value, type] = data[i];
    
    switch(type) {
      case 'decimal':
        config[key] = parseFloat(value);
        break;
      case 'integer':
        config[key] = parseInt(value);
        break;
      case 'percentage':
        config[key] = typeof value === 'string' ? 
          parseFloat(value.replace('%', '')) / 100 :
          parseFloat(value) / 100;
        break;
      case 'csv':
        config[key] = typeof value === 'string' ? 
          value.split(',').map(item => item.trim()) :
          [];
        break;
      default:
        config[key] = value;
    }
  }
  
  return config;
}