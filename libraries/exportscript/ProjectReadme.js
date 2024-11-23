
/**
 * Main function to export all files and generate README
 * @param {string} folderId - Google Drive folder ID where backups will be stored
 * @returns {object} Result object with status and details
 */
function exportProjectWithReadme(folderId) {
  try {
    if (!folderId) {
      throw new Error('Folder ID is required');
    }

    // Create timestamp folder
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    const projectName = DriveApp.getFileById(ScriptApp.getScriptId()).getName();
    const backupFolder = DriveApp.getFolderById(folderId).createFolder(`${projectName}_${timestamp}`);
    
    // Get all files from the project
    const scriptId = ScriptApp.getScriptId();
    const files = getProjectFiles(scriptId);
    
    // Export individual files
    const exportedFiles = [];
    files.forEach(file => {
      const content = `// ${file.name}\n// Last updated: ${new Date().toISOString()}\n\n${file.source}`;
      const newFile = backupFolder.createFile(file.name, content, MimeType.JAVASCRIPT);
      exportedFiles.push(newFile.getName());
    });
    
    // Consolidate all functions into one text file
    const consolidatedContent = files.map(file => 
      `// ${file.name}\n\n${file.source}\n\n`
    ).join('\n');
    
    const consolidatedFile = backupFolder.createFile(
      'all_functions.txt', 
      consolidatedContent, 
      MimeType.PLAIN_TEXT
    );
    
    // Generate README using OpenAI
    const readme = generateReadme(consolidatedContent);
    if (readme.success) {
      backupFolder.createFile('README.md', readme.content, MimeType.PLAIN_TEXT);
      exportedFiles.push('README.md');
    }
    
    return {
      success: true,
      message: "Project exported and README generated successfully",
      location: backupFolder.getUrl(),
      folderId: backupFolder.getId(),
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
      },
      muteHttpExceptions: true
    }
  ).getContentText());
  
  if (response.error) {
    throw new Error(`Failed to get project files: ${response.error.message}`);
  }
  
  return response.files.map(file => ({
    name: file.name + '.gs',
    source: file.source
  }));
}

/**
 * Generates README content using OpenAI with a developer handoff focus
 * @param {string} codeContent - Consolidated code content
 * @returns {object} Result object with generated README content
 */
function generateReadme(codeContent) {
  const openAiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!openAiKey) {
    return {
      success: false,
      message: "OpenAI API key not found in Script Properties"
    };
  }

  try {
    const prompt = `You are a technical documentation expert. Please analyze this Google Apps Script codebase and create a comprehensive README.md file for a developer handoff. 
    
    Focus on:
    1. Project Overview
       - What problem does this project solve?
       - Key features and capabilities
       
    2. Codebase Structure
       - List and describe each .gs file and its purpose
       - Key dependencies and integrations
       
    3. Function Directory
       - List ALL functions grouped by their file location
       - For each function include:
         * Brief description of what it does
         * Key parameters and return values
         * Any important notes or warnings
         
    4. Setup Guide
       - Step-by-step setup instructions
       - Required permissions and OAuth scopes
       - Configuration requirements
       
    5. Common Use Cases
       - Example scenarios and how to implement them
       - Code snippets for common operations
       
    6. Development Notes
       - Important considerations for future development
       - Known limitations or areas for improvement
       - Any technical debt to be aware of
    
    Format the README in Markdown and make it as detailed as possible while maintaining readability.
    Focus on helping a new developer understand and maintain this codebase.
    
    Here's the code to analyze:
    
    ${codeContent}`;

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + openAiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-3.5-turbo-16k',  // Using 16k model for longer context
        messages: [{
          role: 'system',
          content: 'You are a technical documentation expert who specializes in creating clear, comprehensive documentation for developer handoffs. Focus on providing practical, actionable information that helps developers understand and maintain the codebase.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 4000  // Increased token limit for more detailed README
      }),
      muteHttpExceptions: true
    });

    const json = JSON.parse(response.getContentText());
    if (json.error) {
      throw new Error(json.error.message);
    }

    return {
      success: true,
      content: json.choices[0].message.content
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "README generation failed: " + error.toString()
    };
  }
}

/**
 * Helper function to test the README generation separately
 */
function testReadmeGeneration() {
  const content = consolidateFiles();
  const result = generateReadme(content);
  console.log(result);
}