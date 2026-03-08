import { useMemo, useCallback } from 'react';

interface UseOptimizedListOptions<T> {
  data: T[];
  pageSize?: number;
  searchQuery?: string;
  searchKeys?: (keyof T)[];
  sortKey?: keyof T;
  sortOrder?: 'asc' | 'desc';
}

export function useOptimizedList<T>({
  data,
  pageSize: _pageSize = 20,
  searchQuery = '',
  searchKeys = [],
  sortKey,
  sortOrder = 'asc',
}: UseOptimizedListOptions<T>) {
  const filteredData = useMemo(() => {
    if (!searchQuery || searchKeys.length === 0) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 80,
      offset: 80 * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    return item.id || `item-${index}`;
  }, []);

  return {
    data: sortedData,
    getItemLayout,
    keyExtractor,
    totalCount: sortedData.length,
  };
}
