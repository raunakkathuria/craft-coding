const { deployToCDN, deployMultipleFiles, testCDNAccess } = require('../src/deployer');
const fs = require('fs');
const axios = require('axios');

// Mock dependencies
jest.mock('fs');
jest.mock('axios');

describe('Deployer Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deployToCDN', () => {
    const mockConfig = {
      apiToken: 'test-token',
      zoneId: 'test-zone',
      accountId: 'test-account',
      namespaceId: 'test-namespace',
      cdnDomain: 'test-cdn.com'
    };

    it('should validate required configuration', async () => {
      const incompleteConfig = { apiToken: 'test-token' };

      await expect(deployToCDN(incompleteConfig, 'test.js', 'test.js'))
        .rejects.toThrow('Missing required Cloudflare configuration');
    });

    it('should validate file exists', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(deployToCDN(mockConfig, 'nonexistent.js', 'test.js'))
        .rejects.toThrow('File not found: nonexistent.js');
    });

    it('should successfully deploy file to CDN', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('test content');
      axios.put.mockResolvedValue({
        data: { success: true }
      });

      const result = await deployToCDN(mockConfig, 'test.js', 'test.js');

      expect(result).toEqual({
        success: true,
        fileName: 'test.js',
        size: 12,
        url: 'https://test-cdn.com/test.js',
        kvResult: { success: true, key: 'test.js', size: 12 }
      });
    });

    it('should handle Cloudflare API errors', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('test content');
      axios.put.mockRejectedValue({
        response: { status: 401, data: { error: 'Unauthorized' } }
      });

      await expect(deployToCDN(mockConfig, 'test.js', 'test.js'))
        .rejects.toThrow('CDN deployment failed: Cloudflare authentication failed - check API token');
    });

    it('should handle network errors', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('test content');
      axios.put.mockRejectedValue(new Error('Network timeout'));

      await expect(deployToCDN(mockConfig, 'test.js', 'test.js'))
        .rejects.toThrow('CDN deployment failed: Network error: Network timeout');
    });
  });

  describe('deployMultipleFiles', () => {
    const mockConfig = {
      apiToken: 'test-token',
      zoneId: 'test-zone',
      accountId: 'test-account',
      namespaceId: 'test-namespace',
      cdnDomain: 'test-cdn.com'
    };

    it('should deploy multiple files successfully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('test content');
      axios.put.mockResolvedValue({
        data: { success: true }
      });

      const files = [
        { filePath: 'test1.js', fileName: 'test1.js' },
        { filePath: 'test2.js', fileName: 'test2.js' }
      ];

      const result = await deployMultipleFiles(mockConfig, files);

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('test content');

      // First call succeeds, second fails
      axios.put
        .mockResolvedValueOnce({ data: { success: true } })
        .mockRejectedValueOnce(new Error('Upload failed'));

      const files = [
        { filePath: 'test1.js', fileName: 'test1.js' },
        { filePath: 'test2.js', fileName: 'test2.js' }
      ];

      const result = await deployMultipleFiles(mockConfig, files);

      expect(result.success).toBe(false);
      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('testCDNAccess', () => {
    it('should return success for accessible CDN', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: 'test content',
        headers: { 'content-type': 'application/javascript' }
      });

      const result = await testCDNAccess('https://test-cdn.com/test.js');

      expect(result).toEqual({
        success: true,
        status: 200,
        size: 12,
        contentType: 'application/javascript'
      });
    });

    it('should handle HTTP errors', async () => {
      axios.get.mockResolvedValue({
        status: 404
      });

      const result = await testCDNAccess('https://test-cdn.com/test.js');

      expect(result).toEqual({
        success: false,
        status: 404,
        message: 'HTTP 404'
      });
    });

    it('should handle network errors', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await testCDNAccess('https://test-cdn.com/test.js');

      expect(result).toEqual({
        success: false,
        error: 'Network error'
      });
    });
  });
});
