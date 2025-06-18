const { fetchApiData } = require('./fetcher');
const { transformToJS, saveToFile } = require('./transformer');
const config = require('./config');
const path = require('path');

async function main() {
  console.log('🚀 Starting API-to-CDN sync process...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Process single endpoint for MVP
    const endpoint = config.endpoints[0];
    console.log(`Processing endpoint: ${endpoint.name}`);

    // Step 1: Fetch data from API
    console.log('📡 Fetching data from API...');
    const apiData = await fetchApiData({
      apiBaseUrl: config.apiBaseUrl,
      path: endpoint.path
    });

    console.log(`✅ Successfully fetched ${apiData.data?.length || 0} records`);

    // Step 2: Transform data to JavaScript module
    console.log('🔄 Transforming data to JavaScript module...');
    const jsContent = transformToJS(apiData, endpoint);

    // Step 3: Save to output file
    console.log('💾 Saving to output file...');
    const outputPath = path.join('output', endpoint.outputFile);
    saveToFile(jsContent, outputPath);

    console.log('🎉 Sync process completed successfully!');
    console.log(`📄 Generated file: ${outputPath}`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`- Endpoint: ${endpoint.name}`);
    console.log(`- Records: ${apiData.data?.length || 0}`);
    console.log(`- Output: ${outputPath}`);
    console.log(`- Size: ${jsContent.length} bytes`);

  } catch (error) {
    console.error('❌ Sync process failed:');
    console.error(`Error: ${error.message}`);

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
