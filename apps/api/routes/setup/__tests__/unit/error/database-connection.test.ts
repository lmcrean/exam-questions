import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create mock functions outside of the mock definition
const mockRaw = vi.fn();
const mockDestroy = vi.fn();

// Mock the database module - use @repo/db path since we're now using the monorepo package
vi.mock('@repo/db', () => {
  return {
    db: {
      raw: mockRaw,
      client: {
        config: {
          client: 'mssql'
        }
      },
      destroy: mockDestroy
    }
  };
});

// Import after mocking
import { db } from '@repo/db';

describe('Database Connection Error Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockRaw.mockClear();
    mockDestroy.mockClear();
  });

  afterEach(() => {
    // Clean up
    mockRaw.mockReset();
    mockDestroy.mockReset();
  });

  it('should handle database connection failures gracefully', async () => {
    // Setup the mock to simulate a connection error
    const errorMessage = 'Connection timeout: could not connect to database';
    mockRaw.mockRejectedValueOnce(new Error(errorMessage));

    try {
      await db.raw('SELECT 1 as testValue');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
    }

    // Verify the raw method was called
    expect(mockRaw).toHaveBeenCalledWith('SELECT 1 as testValue');
  });

  it('should handle SQL query errors properly', async () => {
    // Setup the mock to simulate a SQL syntax error
    const errorMessage = 'SQL syntax error: invalid syntax in query';
    mockRaw.mockRejectedValueOnce(new Error(errorMessage));

    try {
      await db.raw('INVALID SQL QUERY');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
    }

    // Verify the raw method was called
    expect(mockRaw).toHaveBeenCalledWith('INVALID SQL QUERY');
  });
}); 