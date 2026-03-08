import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '../storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve and parse stored data', async () => {
      const mockData = { id: '1', title: 'Test' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await storage.get('HABITS');
      expect(result).toEqual(mockData);
    });

    it('should return null if no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await storage.get('HABITS');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should stringify and store data', async () => {
      const mockData = { id: '1', title: 'Test' };
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await storage.set('HABITS', mockData);
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@madeen:habits',
        JSON.stringify(mockData)
      );
    });
  });

  describe('remove', () => {
    it('should remove data from storage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await storage.remove('HABITS');
      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@madeen:habits');
    });
  });

  describe('clear', () => {
    it('should clear all storage', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

      const result = await storage.clear();
      expect(result).toBe(true);
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });
});
