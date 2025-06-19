const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Deploy files to Cloudflare CDN
 * @param {Object} config - Deployment configuration
 * @param {string} config.apiToken - Cloudflare API token
 * @param {string} config.zoneId - Cloudflare zone ID
 * @param {string} config.accountId - Cloudflare account ID
 * @param {string} filePath - Path to file to deploy
 * @param {string} fileName - Name for the file on CDN
 * @returns {Promise<Object>} Deployment result
 */
async function deployToCDN(config, filePath, fileName) {
  console.log(`🚀 Deploying ${fileName} to Cloudflare CDN...`);

  // Validate required configuration
  if (!config.apiToken || !config.zoneId || !config.accountId) {
    throw new Error('Missing required Cloudflare configuration: apiToken, zoneId, accountId');
  }

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Upload to Cloudflare KV (Key-Value storage) for CDN serving
    const kvResult = await uploadToKV(config, fileName, fileContent);

    console.log(`✅ Successfully deployed ${fileName} to CDN`);
    return {
      success: true,
      fileName: fileName,
      size: fileContent.length,
      url: `https://${config.cdnDomain}/${fileName}`,
      kvResult: kvResult
    };

  } catch (error) {
    console.error(`❌ Failed to deploy ${fileName}:`, error.message);
    throw new Error(`CDN deployment failed: ${error.message}`);
  }
}

/**
 * Upload content to Cloudflare KV storage
 * @param {Object} config - Cloudflare configuration
 * @param {string} key - KV key name
 * @param {string} content - Content to store
 * @returns {Promise<Object>} Upload result
 */
async function uploadToKV(config, key, content) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.namespaceId}/values/${key}`;

  const headers = {
    'Authorization': `Bearer ${config.apiToken}`,
    'Content-Type': 'application/javascript'
  };

  try {
    const response = await axios.put(url, content, {
      headers,
      timeout: 30000 // 30 second timeout for uploads
    });

    if (response.data.success) {
      return {
        success: true,
        key: key,
        size: content.length
      };
    } else {
      throw new Error(`KV upload failed: ${JSON.stringify(response.data.errors)}`);
    }

  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Cloudflare authentication failed - check API token');
    }

    if (error.response?.status === 403) {
      throw new Error('Cloudflare access denied - check account permissions');
    }

    if (error.response?.data?.errors) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(error.response.data.errors)}`);
    }

    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Deploy multiple files to CDN
 * @param {Object} config - Deployment configuration
 * @param {Array} files - Array of {filePath, fileName} objects
 * @returns {Promise<Object>} Deployment results
 */
async function deployMultipleFiles(config, files) {
  console.log(`🚀 Deploying ${files.length} files to CDN...`);

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const file of files) {
    try {
      const result = await deployToCDN(config, file.filePath, file.fileName);
      results.push(result);
      successCount++;
    } catch (error) {
      results.push({
        success: false,
        fileName: file.fileName,
        error: error.message
      });
      failureCount++;
    }
  }

  console.log(`📊 Deployment Summary: ${successCount} successful, ${failureCount} failed`);

  return {
    success: failureCount === 0,
    total: files.length,
    successful: successCount,
    failed: failureCount,
    results: results
  };
}

/**
 * Test CDN accessibility by making a GET request
 * @param {string} url - CDN URL to test
 * @returns {Promise<Object>} Test result
 */
async function testCDNAccess(url) {
  console.log(`🧪 Testing CDN accessibility: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept 4xx as valid responses
    });

    if (response.status === 200) {
      console.log(`✅ CDN accessible: ${url} (${response.data.length} bytes)`);
      return {
        success: true,
        status: response.status,
        size: response.data.length,
        contentType: response.headers['content-type']
      };
    } else {
      console.log(`⚠️ CDN returned status ${response.status}: ${url}`);
      return {
        success: false,
        status: response.status,
        message: `HTTP ${response.status}`
      };
    }

  } catch (error) {
    console.error(`❌ CDN test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  deployToCDN,
  deployMultipleFiles,
  testCDNAccess
};
