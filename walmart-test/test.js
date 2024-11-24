
function helloWorld() {
    // Multiple log types to ensure visibility
    logit("Starting helloWorld function");
    Logger.log("Logger: Starting helloWorld function");

    // Force a timestamp to help identify this specific run
    const timestamp = new Date().toISOString();
    logit(`Run timestamp: ${timestamp}`);

    // Add some error logging to catch any issues
    try {
        throw new Error("Test error");
    } catch (e) {
        console.error("Test error log:", e);
    }

    return "The function helloWorld returned";
}

function logit(thisIsTheString) {
    Logger.log(thisIsTheString);

    return thisIsTheString;
}
