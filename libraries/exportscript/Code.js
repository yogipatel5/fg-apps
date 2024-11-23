// First, enable the Apps Script API in your Google Cloud Project
// and add this OAuth Scope: https://www.googleapis.com/auth/script.projects

/**
 * Main function to export all files from current project to Drive
 * @param {string} folderId - Google Drive folder ID where backups will be stored
 * @param {boolean} createTimestampFolder - Whether to create a timestamped subfolder for this backup
 * @returns {object} Result object with status and details
 */
function exportProjectToDrive(folderId, createTimestampFolder = true) {
  try {
    // Get current project
    const scriptId = ScriptApp.getScriptId();
    const project = {
      files: getProjectFiles(scriptId),
      name: DriveApp.getFileById(scriptId).getName()
    };
    
    // Create timestamp folder if requested
    let targetFolder;
    if (createTimestampFolder) {
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
      targetFolder = DriveApp.getFolderById(folderId).createFolder(`${project.name}_${timestamp}`);
    } else {
      targetFolder = DriveApp.getFolderById(folderId);
    }
    
    // Export each file
    const exportedFiles = [];
    project.files.forEach(file => {
      const content = `// ${file.name}\n// Last updated: ${new Date().toISOString()}\n\n${file.source}`;
      const newFile = targetFolder.createFile(file.name, content, MimeType.JAVASCRIPT);
      exportedFiles.push(newFile.getName());
    });
    
    return {
      success: true,
      message: "Project exported successfully",
      location: targetFolder.getUrl(),
      files: exportedFiles
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Export failed: " + error.toString()
    };
  }
}

/**
 * Gets all files from a Google Apps Script project
 * @param {string} scriptId - The ID of the script project
 * @returns {Array} Array of file objects with name and source
 */
function getProjectFiles(scriptId) {
  const response = JSON.parse(UrlFetchApp.fetch(
    `https://script.googleapis.com/v1/projects/${scriptId}/content`,
    {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      }
    }
  ).getContentText());
  
  return response.files.map(file => ({
    name: file.name + '.gs',
    source: file.source
  }));
}

/**
 * Creates a backup schedule for the current project
 * @param {string} folderId - Google Drive folder ID where backups will be stored
 * @param {string} frequency - 'DAILY' or 'WEEKLY' or 'MONTHLY'
 */
function scheduleBackup(folderId, frequency = 'DAILY') {
  // Delete any existing triggers first
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runScheduledBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger
  switch (frequency.toUpperCase()) {
    case 'DAILY':
      ScriptApp.newTrigger('runScheduledBackup')
        .timeBased()
        .everyDays(1)
        .atHour(1)
        .create();
      break;
    case 'WEEKLY':
      ScriptApp.newTrigger('runScheduledBackup')
        .timeBased()
        .everyWeeks(1)
        .onMonday()
        .atHour(1)
        .create();
      break;
    case 'MONTHLY':
      ScriptApp.newTrigger('runScheduledBackup')
        .timeBased()
        .onMonthDay(1)
        .atHour(1)
        .create();
      break;
    default:
      throw new Error('Invalid frequency. Use DAILY, WEEKLY, or MONTHLY');
  }
}

/**
 * Handler function for the scheduled backup
 * This is the function that will be called by the trigger
 */
function runScheduledBackup() {
  // You'll need to store the folder ID in Properties Service
  const folderId = PropertiesService.getScriptProperties().getProperty('BACKUP_FOLDER_ID');
  if (!folderId) {
    console.error('Backup folder ID not set in Script Properties');
    return;
  }
  
  return exportProjectToDrive(folderId, true);
}