const { transformToJS, saveToFile } = require('../src/transformer');
const fs = require('fs');
const path = require('path');

describe('transformToJS', () => {
  test('should convert JSON to ES6 module format', () => {
    const inputData = {
      data: [
        { account: { specification: { display_name: 'Test' } } }
      ]
    };

    const config = { name: 'account-specs' };

    const result = transformToJS(inputData, config);

    expect(result).toContain('export const accountSpecs');
    expect(result).toContain(JSON.stringify(inputData, null, 2));
    expect(result).toContain('export const metadata');
  });

  test('should handle camelCase conversion correctly', () => {
    const inputData = { data: [] };
    const config = { name: 'trading-instruments' };

    const result = transformToJS(inputData, config);

    expect(result).toContain('export const tradingInstruments');
  });

  test('should include metadata with timestamp', () => {
    const inputData = { data: [] };
    const config = { name: 'test-endpoint' };

    const result = transformToJS(inputData, config);

    expect(result).toContain('timestamp:');
    expect(result).toContain('source: "test-endpoint"');
    expect(result).toContain('generator: "api-to-cdn-sync"');
    expect(result).toContain('version: "1.0.0"');
  });

  test('should include usage example in output', () => {
    const inputData = { data: [] };
    const config = { name: 'account-specs' };

    const result = transformToJS(inputData, config);

    expect(result).toContain('// Usage example:');
    expect(result).toContain('import { accountSpecs, metadata }');
  });
});

describe('saveToFile', () => {
  const testOutputDir = '/tmp/test-output';
  const testFile = path.join(testOutputDir, 'test-file.js');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  test('should create directories and save file', () => {
    const content = 'export const testData = [];';

    saveToFile(content, testFile);

    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.readFileSync(testFile, 'utf8')).toBe(content);
  });

  test('should overwrite existing files', () => {
    const content1 = 'export const data1 = [];';
    const content2 = 'export const data2 = [];';

    saveToFile(content1, testFile);
    saveToFile(content2, testFile);

    expect(fs.readFileSync(testFile, 'utf8')).toBe(content2);
  });
});
