const axios = require('axios');

async function fetchApiData(config) {
  const url = `${config.apiBaseUrl}${config.path}`;
  const authToken = process.env.API_AUTH_TOKEN;

  if (!authToken) {
    throw new Error('API_AUTH_TOKEN environment variable is required');
  }

  try {
    console.log(`Fetching data from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log(`Successfully fetched data (${response.status})`);
    return response.data;

  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error(`Authentication failed: ${error.response.data.error}`);
    }

    if (error.response?.status >= 400) {
      throw new Error(`API error (${error.response.status}): ${error.response.data?.error || error.message}`);
    }

    throw new Error(`Network error: ${error.message}`);
  }
}

module.exports = { fetchApiData };
