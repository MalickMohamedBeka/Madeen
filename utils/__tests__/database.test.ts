import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  getDatabase,
  closeDatabase,
  executeSQL,
  querySQL,
  querySingleSQL,
} from '../database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock migrations
jest.mock('../databaseMigrations', () => ({
  runMigrations: jest.fn().mockResolvedValue(true),
  getCurrentVersion: jest.fn().mockResolvedValue(1),
}));

describe('Database Utils', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('initDatabase', () => {
    it('should initialize database successfully', async () => {
      const db = await initDatabase();
      
      expect(db).toBeDefined();
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('madeen.db');
    });

    it('should return existing database if already initialized', async () => {
      const db1 = await initDatabase();
      const db2 = await initDatabase();
      
      expect(db1).toBe(db2);
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw error if migration fails', async () => {
      const { runMigrations } = require('../databaseMigrations');
      runMigrations.mockResolvedValueOnce(false);

      await expect(initDatabase()).rejects.toThrow('Database migration failed');
    });
  });

  describe('getDatabase', () => {
    it('should return initialized database', async () => {
      await initDatabase();
      const db = await getDatabase();
      
      expect(db).toBeDefined();
    });

    it('should initialize database if not already initialized', async () => {
      const db = await getDatabase();
      
      expect(db).toBeDefined();
      expect(SQLite.openDatabaseAsync).toHaveBeenCalled();
    });
  });

  describe('executeSQL', () => {
    it('should execute SQL statement', async () => {
      await initDatabase();
      
      const result = await executeSQL('INSERT INTO habits (title) VALUES (?)', ['Test']);
      
      expect(result).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO habits (title) VALUES (?)',
        ['Test']
      );
    });

    it('should handle SQL execution errors', async () => {
      await initDatabase();
      mockDb.runAsync.mockRejectedValueOnce(new Error('SQL error'));

      await expect(executeSQL('INVALID SQL')).rejects.toThrow('SQL error');
    });
  });

  describe('querySQL', () => {
    it('should query multiple rows', async () => {
      await initDatabase();
      const mockRows = [{ id: 1, title: 'Test 1' }, { id: 2, title: 'Test 2' }];
      mockDb.getAllAsync.mockResolvedValueOnce(mockRows);

      const result = await querySQL('SELECT * FROM habits');
      
      expect(result).toEqual(mockRows);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM habits', []);
    });

    it('should handle query errors', async () => {
      await initDatabase();
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Query error'));

      await expect(querySQL('SELECT * FROM invalid_table')).rejects.toThrow('Query error');
    });
  });

  describe('querySingleSQL', () => {
    it('should query single row', async () => {
      await initDatabase();
      const mockRow = { id: 1, title: 'Test' };
      mockDb.getFirstAsync.mockResolvedValueOnce(mockRow);

      const result = await querySingleSQL('SELECT * FROM habits WHERE id = ?', [1]);
      
      expect(result).toEqual(mockRow);
    });

    it('should return null if no row found', async () => {
      await initDatabase();
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const result = await querySingleSQL('SELECT * FROM habits WHERE id = ?', [999]);
      
      expect(result).toBeNull();
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', async () => {
      await initDatabase();
      await closeDatabase();
      
      expect(mockDb.closeAsync).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      await initDatabase();
      mockDb.closeAsync.mockRejectedValueOnce(new Error('Close error'));

      await expect(closeDatabase()).resolves.not.toThrow();
    });
  });
});
