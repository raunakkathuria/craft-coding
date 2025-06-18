const fs = require('fs');
const path = require('path');

function transformToJS(data, config) {
  const varName = toCamelCase(config.name);
  const timestamp = new Date().toISOString();

  const jsContent = `// Generated on ${timestamp}
// Source: ${config.name}

export const ${varName} = ${JSON.stringify(data, null, 2)};

export const metadata = {
  timestamp: "${timestamp}",
  source: "${config.name}",
  generator: "api-to-cdn-sync",
  version: "1.0.0"
};

// Usage example:
// import { ${varName}, metadata } from './account-specifications.js';
// console.log('Data generated:', metadata.timestamp);
`;

  return jsContent;
}

function saveToFile(content, outputPath) {
  const dir = path.dirname(outputPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }

  // Write file
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`Saved file: ${outputPath} (${content.length} bytes)`);
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

module.exports = { transformToJS, saveToFile };
