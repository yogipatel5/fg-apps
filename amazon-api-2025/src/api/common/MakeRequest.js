// Common API functionality
function makeApiRequest(endpoint, options = {}) {
  const accessToken = getAccessToken();
  
  const defaultOptions = {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "x-amz-access-token": accessToken,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };
  
  // Merge options, with provided options taking precedence
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  return UrlFetchApp.fetch(endpoint, mergedOptions);
}

// Helper for GET requests
function makeGetRequest(endpoint) {
  return makeApiRequest(endpoint, { method: 'get' });
}

// Helper for POST requests
function makePostRequest(endpoint, payload) {
  return makeApiRequest(endpoint, {
    method: 'post',
    payload: JSON.stringify(payload)
  });
}
      