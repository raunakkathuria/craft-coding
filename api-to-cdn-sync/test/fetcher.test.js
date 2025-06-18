const { fetchApiData } = require('../src/fetcher');

describe('fetchApiData', () => {
  test('should fetch data from valid URL with auth', async () => {
    const config = {
      apiBaseUrl: 'http://mock-api:3001',
      path: '/api/account-specs'
    };

    const result = await fetchApiData(config);

    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.metadata).toBeDefined();
  });

  test('should handle authentication errors', async () => {
    // Mock invalid token scenario
    const originalToken = process.env.API_AUTH_TOKEN;
    process.env.API_AUTH_TOKEN = 'invalid-token';

    const config = {
      apiBaseUrl: 'http://mock-api:3001',
      path: '/api/account-specs'
    };

    await expect(fetchApiData(config)).rejects.toThrow();

    // Restore token
    process.env.API_AUTH_TOKEN = originalToken;
  });

  test('should handle network errors gracefully', async () => {
    const config = {
      apiBaseUrl: 'http://nonexistent-api:9999',
      path: '/api/test'
    };

    await expect(fetchApiData(config)).rejects.toThrow();
  });

  test('should require authentication token', async () => {
    const originalToken = process.env.API_AUTH_TOKEN;
    delete process.env.API_AUTH_TOKEN;

    const config = {
      apiBaseUrl: 'http://mock-api:3001',
      path: '/api/account-specs'
    };

    await expect(fetchApiData(config)).rejects.toThrow('API_AUTH_TOKEN environment variable is required');

    // Restore token
    process.env.API_AUTH_TOKEN = originalToken;
  });
});
