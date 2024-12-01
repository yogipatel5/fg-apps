

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_message "Welcome to the Google Apps Script Project Setup!"
print_message "----------------------------------------------"


DEFAULT_PROJECT_ID="832100749992"
project_path=""

# Ask if it's a library
read -p "Is this a library? (y/n): " is_library

# Get project name
read -p "Enter the project name: " project_name

# Get project id
read -p "Enter the project id: " project_id

# Get script id
read -p "Enter the script id: " script_id


# Set directory path based on whether it's a library or not
if [ "$is_library" = "y" ]; then
    project_path="$PWD/libraries/$project_name"
else
    project_path="$PWD/$project_name"
fi


# Confirm project directory
echo $project_path
read -p "Is this the correct project directory? (y/n): " confirm_project_directory

if [ "$confirm_project_directory" != "y" ]; then
    # Get project path
    read -p "Enter the project path: " project_path

fi

print_message "----------------------------------------------"
print_message "Confirming all details"
print_message "----------------------------------------------"

# Confrim all details
echo Project Name: $project_name
# Add space
echo ""
echo Project ID: $project_id
echo ""
echo Project Path: $project_path
echo ""
echo Is Library: $is_library
echo ""
echo Script ID: $script_id
echo ""
read -p "Are all details correct? (y/n): " confirm_details

if [ "$confirm_details" != "y" ]; then
    exit 1
fi

# Create the project directory if it doesn't exist
mkdir -p "$project_path"

cp .clasprc.json "$project_path/.clasprc.json"

# Go to project path
cd "$project_path"

# create the .clasp.json file
cat > .clasp.json << EOL
{
    "scriptId": "$script_id",
    "rootDir": "$project_path",
    "projectId": "$project_id"
}
EOL

clasp pull

# Read appsscript.json and add executionApi
if ! grep -q "executionApi" appsscript.json; then
    # Create temp file with updated JSON
    jq '. + {"executionApi": {"access": "ANYONE"}}' appsscript.json > temp.json
    mv temp.json appsscript.json
    print_message "Added executionApi to appsscript.json"
else
    # Update existing executionApi
    jq '.executionApi = {"access": "ANYONE"}' appsscript.json > temp.json
    mv temp.json appsscript.json
    print_message "Updated existing executionApi in appsscript.json"
fi

# Verify executionApi was added correctly
sleep 1 # Give file system time to sync
if ! grep -q '"executionApi": *{.*"access": *"ANYONE"' appsscript.json; then
    print_error "Failed to add/update executionApi in appsscript.json"
    exit 1
fi

print_message "Appscript.json updated with executionApi"
# Create a test.js file
touch test.js
print_message "test.js created"



# Add function helloWorld to the test.js file
echo "function helloWorld() { console.log('hello world'); }" > test.js
print_message "function helloWorld added to test.js"
# Run clasp push to push the test.js file
clasp push
print_message "test.js pushed to Google Apps Script"

echo "Successfully cloned and configured project: Run `clasp run helloWorld` to test"
