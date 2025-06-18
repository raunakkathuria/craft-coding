# Best Practices: API-to-CDN Sync

## Core Development Principles

### 1. Keep It Simple (KISS)
- Start with the simplest solution that works
- Avoid over-engineering - implement only what's needed today
- Prefer readable code over clever optimizations
- Use plain JavaScript before reaching for complex frameworks

### 2. Modular Design for Maintainability
- Single Responsibility Principle - each module does one thing well
- Pure functions wherever possible (easier to test and debug)
- Clear interfaces between modules
- Small functions - aim for < 20 lines

### 3. Don't Pre-optimize
- Measure before optimizing - know what's actually slow
- YAGNI (You Aren't Gonna Need It) - don't build features you might need
- Start simple, scale later - prove the concept first
- Avoid premature abstractions - wait until patterns emerge

### 4. Test-Driven Development (TDD)
- Red-Green-Refactor cycle:
  1. Write failing test (Red)
  2. Make it pass with minimal code (Green)
  3. Improve code quality (Refactor)
- Test behavior, not implementation
- Focus on unit tests only initially

## Unit Testing Guidelines

### What to Test
- Happy path - normal successful operation
- Error cases - network failures, invalid data
- Edge cases - empty data, malformed responses

### What NOT to Test Initially
- Implementation details - focus on behavior
- Third-party libraries - trust they work
- Complex integration scenarios - add explicit instructions if needed later

### Test Structure
```javascript
describe('fetchApiData', () => {
  test('should fetch data from valid URL', async () => {
    // Arrange
    const config = { url: 'https://api.example.com/data' };

    // Act
    const result = await fetchApiData(config);

    // Assert
    expect(result).toEqual(expectedData);
  });
});
```
