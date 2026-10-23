import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/index.js';

export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listProviders();
      setProviders(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { providers, loading, error, reload };
}

export function useProvider(id) {
  const [state, setState] = useState({ provider: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ provider: null, loading: true, error: null });
    api.getProvider(id).then(
      (provider) => active && setState({ provider, loading: false, error: null }),
      (error) => active && setState({ provider: null, loading: false, error }),
    );
    return () => {
      active = false;
    };
  }, [id]);

  return state;
}
