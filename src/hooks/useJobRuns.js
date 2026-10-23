import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/index.js';

// Loads the scheduled job runs. With refreshMs set, reloads on that interval
// while the tab is visible. Existing rows stay on screen during a reload.
export function useJobRuns({ refreshMs } = {}) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);
  const inFlight = useRef(false);

  const reload = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const list = await api.listJobRuns();
      setRuns(Array.isArray(list) ? list : []);
      setError(null);
      setLoadedAt(new Date());
    } catch (err) {
      setError(err);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!refreshMs) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) reload();
    }, refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs, reload]);

  return { runs, loading, error, loadedAt, reload };
}

export function useJobRun(runId) {
  const [state, setState] = useState({ run: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ run: null, loading: true, error: null });
    api.getJobRun(runId).then(
      (run) => active && setState({ run, loading: false, error: null }),
      (error) => active && setState({ run: null, loading: false, error }),
    );
    return () => {
      active = false;
    };
  }, [runId]);

  return state;
}
