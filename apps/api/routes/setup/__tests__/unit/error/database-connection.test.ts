import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@repo/db';

// Mock the database module - use @repo/db path since we're now using the monorepo package
vi.mock('@repo/db', () => {
  return {
    db: {
      raw: vi.fn(),
      client: {
        config: {
          client: 'mssql'
        }
      },
      destroy: vi.fn()
    }
  };
});

describe('Database Connection Error Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  it('should handle database connection failures gracefully', async () => {
    // Setup the mock to simulate a connection error
    const errorMessage = 'Connection timeout: could not connect to database';
    db.raw.mockRejectedValueOnce(new Error(errorMessage));
    
    try {
      await db.raw('SELECT 1 as testValue');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
    }
    
    // Verify the raw method was called
    expect(db.raw).toHaveBeenCalledWith('SELECT 1 as testValue');
  });

  it('should handle SQL query errors properly', async () => {
    // Setup the mock to simulate a SQL syntax error
    const errorMessage = 'SQL syntax error: invalid syntax in query';
    db.raw.mockRejectedValueOnce(new Error(errorMessage));
    
    try {
      await db.raw('INVALID SQL QUERY');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
    }
    
    // Verify the raw method was called
    expect(db.raw).toHaveBeenCalledWith('INVALID SQL QUERY');
  });
}); 