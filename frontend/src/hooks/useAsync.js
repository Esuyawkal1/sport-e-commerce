import { useState, useCallback } from 'react';

/**
 * Lightweight async state manager.
 * Tracks loading + error for any async operation without extra libraries.
 *
 * @example
 * const { loading, error, run } = useAsync();
 * const result = await run(() => api.getPosts());
 */
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      let message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Something went wrong.';

      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        message =
          'Unable to connect to the server. Please check your connection or ensure the backend service is running.';
      }

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}
