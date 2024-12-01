// In your project's script
function setupBackup() {
  // Replace with your backup folder ID
  const BACKUP_FOLDER_ID = '1W2RTNMEnu1dL0B7kfhcDB-fqJAo2DTgz';
  
  // Store folder ID in properties
  PropertiesService.getScriptProperties().setProperty('BACKUP_FOLDER_ID', BACKUP_FOLDER_ID);
  
  // Schedule daily backups
  ExportScript.scheduleBackup(BACKUP_FOLDER_ID, 'DAILY');
}

// Or do a one-time backup
function doBackup() {
  const BACKUP_FOLDER_ID = '1W2RTNMEnu1dL0B7kfhcDB-fqJAo2DTgz';
  const result = ExportScript.exportProjectToDrive(BACKUP_FOLDER_ID);
  console.log(result);
}

function doFullBackup() {
  const BACKUP_FOLDER_ID = '1W2RTNMEnu1dL0B7kfhcDB-fqJAo2DTgz'; // Your folder ID
  const result = ExportScript.exportProjectWithReadme(BACKUP_FOLDER_ID);
  console.log(result);
  // result example:
  // { success: true,
  // message: 'Project exported and README generated successfully',
  // location: 'https://drive.google.com/drive/folders/1IKaX_JSa4rspbImk-fkLAex7eqtcECrA',
  // folderId: '1IKaX_JSa4rspbImk-fkLAex7eqtcECrA',
  // files: 
  //  [ 'appsscript.gs',
  //    'Code.gs',
  //    'walmart.gs',
  //    'shipbreeze_to_db.gs',
  //    '_dbConnections.gs',
  //    'upload_download_data.gs',
  //    '-runInventoryUpdate.gs',
  //    'walmart_product_update.gs',
  //    'payloads.gs',
  //    'ExportThis.gs',
  //    'README.md' ] }
}