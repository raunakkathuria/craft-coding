const { deployToCDN, deployMultipleFiles, testCDNAccess } = require('../src/deployer');
const config = require('./config.json');
const path = require('path');
const fs = require('fs');

/**
 * Load deployment configuration from environment variables
 * @param {string} environment - Environment name (development/production)
 * @returns {Object} Deployment configuration
 */
function loadDeploymentConfig(environment = 'development') {
  const envConfig = config[environment];

  if (!envConfig) {
    throw new Error(`Environment '${environment}' not found in config`);
  }

  return {
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    namespaceId: envConfig.namespaceId,
    cdnDomain: envConfig.cdnDomain,
    settings: config.settings
  };
}

/**
 * Deploy all files from output directory to CDN
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Deployment results
 */
async function deployOutputFiles(environment = 'development') {
  console.log(`🚀 Starting CDN deployment for ${environment} environment...`);

  try {
    const deployConfig = loadDeploymentConfig(environment);
    const outputDir = path.join(__dirname, '../src/output');

    // Check if output directory exists
    if (!fs.existsSync(outputDir)) {
      throw new Error(`Output directory not found: ${outputDir}`);
    }

    // Get all JavaScript files from output directory
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        filePath: path.join(outputDir, file),
        fileName: file
      }));

    if (files.length === 0) {
      console.log('⚠️ No JavaScript files found in output directory');
      return { success: true, message: 'No files to deploy' };
    }

    console.log(`📁 Found ${files.length} files to deploy:`, files.map(f => f.fileName));

    // Deploy files to CDN
    const results = await deployMultipleFiles(deployConfig, files);

    // Test CDN accessibility for successful deployments
    if (results.successful > 0) {
      console.log('🧪 Testing CDN accessibility...');

      for (const result of results.results) {
        if (result.success) {
          await testCDNAccess(result.url);
        }
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

/**
 * Deploy a single file to CDN
 * @param {string} filePath - Path to file to deploy
 * @param {string} fileName - Name for file on CDN
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Deployment result
 */
async function deploySingleFile(filePath, fileName, environment = 'development') {
  console.log(`🚀 Deploying ${fileName} to ${environment} environment...`);

  try {
    const deployConfig = loadDeploymentConfig(environment);
    const result = await deployToCDN(deployConfig, filePath, fileName);

    // Test CDN accessibility
    if (result.success) {
      await testCDNAccess(result.url);
    }

    return result;

  } catch (error) {
    console.error('❌ Single file deployment failed:', error.message);
    throw error;
  }
}

/**
 * Validate deployment configuration
 * @param {string} environment - Environment to validate
 * @returns {Object} Validation result
 */
function validateConfig(environment = 'development') {
  console.log(`🔍 Validating ${environment} configuration...`);

  const issues = [];

  try {
    const deployConfig = loadDeploymentConfig(environment);

    // Check required environment variables
    if (!deployConfig.apiToken) {
      issues.push('Missing CLOUDFLARE_API_TOKEN environment variable');
    }

    if (!deployConfig.zoneId) {
      issues.push('Missing CLOUDFLARE_ZONE_ID environment variable');
    }

    if (!deployConfig.accountId) {
      issues.push('Missing CLOUDFLARE_ACCOUNT_ID environment variable');
    }

    // Check configuration values
    if (!deployConfig.namespaceId || deployConfig.namespaceId.includes('your-')) {
      issues.push(`Namespace ID not configured for ${environment} environment`);
    }

    if (!deployConfig.cdnDomain || deployConfig.cdnDomain.includes('example.com')) {
      issues.push(`CDN domain not configured for ${environment} environment`);
    }

    if (issues.length === 0) {
      console.log('✅ Configuration is valid');
      return { valid: true, issues: [] };
    } else {
      console.log(`❌ Configuration issues found:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
      return { valid: false, issues };
    }

  } catch (error) {
    issues.push(error.message);
    console.log(`❌ Configuration validation failed: ${error.message}`);
    return { valid: false, issues };
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const environment = process.argv[3] || 'development';

  switch (command) {
    case 'deploy':
      deployOutputFiles(environment)
        .then(results => {
          console.log('\n📊 Final Results:', results);
          process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
          console.error('\n❌ Deployment failed:', error.message);
          process.exit(1);
        });
      break;

    case 'validate':
      const validation = validateConfig(environment);
      process.exit(validation.valid ? 0 : 1);
      break;

    default:
      console.log('Usage:');
      console.log('  node deploy.js deploy [environment]    - Deploy all files');
      console.log('  node deploy.js validate [environment]  - Validate configuration');
      console.log('');
      console.log('Environments: development, production');
      process.exit(1);
  }
}

module.exports = {
  deployOutputFiles,
  deploySingleFile,
  validateConfig,
  loadDeploymentConfig
};
