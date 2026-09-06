import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Generic hook for API calls with loading/error state
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (apiFn, { onSuccess, onError, successMsg, showErrorToast = true } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      if (successMsg) toast.success(successMsg);
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      if (showErrorToast) toast.error(msg);
      onError?.(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, call };
}

export default useApi;
