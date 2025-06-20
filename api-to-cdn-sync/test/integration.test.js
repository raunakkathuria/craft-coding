const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('End-to-End Integration', () => {
  const outputDir = 'output';
  const outputFile = path.join(outputDir, 'account-specifications.js');

  beforeEach(() => {
    // Clean output directory
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true });
    }
  });

  test('should complete full sync workflow', async () => {
    // Set up environment for testing
    process.env.API_AUTH_TOKEN = 'test-token-123';

    // Execute main script
    const result = execSync('node main.js', {
      encoding: 'utf8',
      cwd: '/app'
    });

    // Verify output file exists
    expect(fs.existsSync(outputFile)).toBe(true);

    // Verify file content
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain('export const accountSpecs');
    expect(content).toContain('export const metadata');
    expect(content).toContain('timestamp:');

    // Verify data structure
    expect(content).toContain('"display_name": "Standard"');
    expect(content).toContain('"display_name": "Swap-Free"');

    console.log('✅ Integration test passed');
    console.log(`Generated file size: ${content.length} bytes`);
  });

  test('should handle authentication failure gracefully', async () => {
    // Set invalid token
    process.env.API_AUTH_TOKEN = 'invalid-token';

    // Execute main script and expect failure
    expect(() => {
      execSync('node main.js', {
        encoding: 'utf8',
        cwd: '/app'
      });
    }).toThrow();

    // Reset token
    process.env.API_AUTH_TOKEN = 'test-token-123';
  });

  test('should handle missing token gracefully', async () => {
    // Remove token
    const originalToken = process.env.API_AUTH_TOKEN;
    delete process.env.API_AUTH_TOKEN;

    // Execute main script and expect failure
    expect(() => {
      execSync('node main.js', {
        encoding: 'utf8',
        cwd: '/app'
      });
    }).toThrow();

    // Restore token
    process.env.API_AUTH_TOKEN = originalToken;
  });
});
