function exportScriptFiles() {
  const scriptId = ScriptApp.getScriptId();
  Logger.log("Script ID: " + scriptId);
  
  // Create folder with timestamp
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
  const scriptFile = DriveApp.getFileById(scriptId);
  const project = scriptFile.getName();
  Logger.log("Script file name: " + project);
  
  const folderName = `${project}_Scripts_Export_${timestamp}`;
  const folder = DriveApp.createFolder(folderName);
  Logger.log("Created export folder: " + folderName);
  
  try {
    const exportedFiles = [];
    
    // Get all functions in the current script
    const files = DriveApp.getFileById(scriptId);
    const functions = Object.keys(this).filter(key => {
      return typeof this[key] === 'function' && 
             this[key] !== exportScriptFiles && 
             this[key] !== onOpen;
    });
    
    // Create a single .gs file with all functions
    let scriptContent = '// ' + project + '\n\n';
    functions.forEach(functionName => {
      scriptContent += this[functionName].toString() + '\n\n';
    });
    
    // Save as .gs file
    const blob = Utilities.newBlob(scriptContent, 'application/javascript', project + '.gs');
    const scriptFile = folder.createFile(blob);
    
    exportedFiles.push({
      name: project + '.gs',
      url: scriptFile.getUrl()
    });
    
    Logger.log(`Exported script content to ${project}.gs`);
    
    // Create index file
    let indexContent = 'Exported Script Files:\n\n';
    exportedFiles.forEach(file => {
      indexContent += `${file.name}: ${file.url}\n`;
    });
    
    const indexBlob = Utilities.newBlob(indexContent, MimeType.PLAIN_TEXT, 'script_index.txt');
    const indexFile = folder.createFile(indexBlob);
    Logger.log("Created index file");
    
    // Log success details
    Logger.log(`Successfully exported ${exportedFiles.length} files`);
    Logger.log(`Export folder URL: ${folder.getUrl()}`);
    
    // Show completion dialog
    const ui = SpreadsheetApp.getUi();
    const folderUrl = folder.getUrl();
    ui.alert(
      'Script Export Complete',
      `Script has been exported as .gs file.\n\n` +
      `Folder URL: ${folderUrl}\n\n` +
      `Files exported: ${exportedFiles.length}\n\n` +
      `Check the execution logs for details.`,
      ui.ButtonSet.OK
    );
    
    return folder.getUrl();
    
  } catch (error) {
    Logger.log("Error in exportScriptFiles: " + error.toString());
    Logger.log("Stack: " + error.stack);
    
    // Show error to user
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Export Error',
      `Failed to export script files: ${error.toString()}\n\n` +
      `Please check the execution logs for more details.`,
      ui.ButtonSet.OK
    );
    
    throw error;
  }
}