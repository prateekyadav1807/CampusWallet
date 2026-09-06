import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * Hook for fetching data from an API endpoint with auto-refetch support
 */
export function useFetch(endpoint, options = {}) {
  const { params = {}, deps = [], enabled = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!!enabled);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetch = useCallback(async (overrideParams) => {
    if (!enabled && !overrideParams) return;
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint, {
        params: { ...params, ...overrideParams },
        signal: abortRef.current.signal
      });
      setData(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params), enabled, ...deps]);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export default useFetch;
