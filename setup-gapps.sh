#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Constants
DEFAULT_PROJECT_ID="832100749992"

# Function to print colored messages
print_message() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Check if clasp is installed
if ! command -v clasp &> /dev/null; then
    print_error "clasp is not installed. Installing now..."
    npm install -g @google/clasp
fi


print_message "Welcome to the Google Apps Script Project Setup!"
print_message "----------------------------------------------"

# Ask if it's a library
read -p "Is this a library? (y/n): " is_library

# Get project name
read -p "Enter the project name: " project_name

# Set directory path based on whether it's a library or not
if [ "$is_library" = "y" ]; then
    project_path="$PWD/libraries/$project_name"
else
    project_path="$PWD/$project_name"
fi

# Create directory
mkdir -p "$project_path"
cd "$project_path"

# Ask if creating new or cloning existing
read -p "Are you creating a new project or cloning existing one? (new/clone): " project_type

if [ "$project_type" = "clone" ]; then
    read -p "Enter the script ID to clone: " script_id
    clasp clone "$script_id"
else
    # Initialize new project
    clasp create --title "$project_name" --parentId "$DEFAULT_PROJECT_ID"
fi

# Create .clasp.json with project ID
cat > .clasp.json << EOL
{
    "scriptId": "$(cat .clasp.json | grep scriptId | cut -d'"' -f4)",
    "rootDir": ".",
    "projectId": "$DEFAULT_PROJECT_ID"
}
EOL

if [ "$is_library" = "y" ]; then
    # Update manifest for library settings
    cat > appsscript.json << EOL
{
    "timeZone": "America/New_York",
    "dependencies": {},
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "webapp": {
        "executeAs": "USER_DEPLOYING",
        "access": "ANYONE"
    }
}
EOL
else
    # Update manifest for parent script settings
    cat > appsscript.json << EOL
{
    "timeZone": "America/New_York",
    "dependencies": {},
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "webapp": {
        "executeAs": "USER_DEPLOYING",
        "access": "ANYONE_ANONYMOUS"
    }
}
EOL
fi

# Set execution API to ANYONE
clasp settings deploymentId $(clasp deployments | grep -o 'AKf[^"]*' | head -1)
clasp deploy --description "Initial deployment"
clasp settings executionApi true

# Create basic file structure
if [ "$is_library" = "y" ]; then
    # Library structure
    touch Code.js
    cat > Code.js << EOL
/**
 * @OnlyCurrentDoc
 */

const namespace = {};

/**
 * Initialize the library
 * @param {Object} options Configuration options
 * @return {Object} The library namespace
 */
function init(options = {}) {
  return namespace;
}
EOL
else
    # Parent script structure
    touch Code.js
    cat > Code.js << EOL
function doGet(e) {
    return ContentService.createTextOutput('Hello, World!');
}

function doPost(e) {
    return ContentService.createTextOutput('Post endpoint active');
}
EOL
fi

# Create README.md
cat > README.md << EOL
# $project_name

## Description
Add your project description here.

## Setup
1. Run \`clasp push\` to deploy changes
2. Run \`clasp open\` to open in editor

## Usage
Add usage instructions here.
EOL

print_success "Setup complete! Your Google Apps Script project is ready for development."
print_message "Next steps:"
print_message "1. Edit Code.js to add your code"
print_message "2. Use 'clasp push' to deploy changes"
print_message "3. Use 'clasp open' to open the script in the editor"

# Show project details
echo ""
print_message "Project Details:"
print_message "----------------"
clasp status


