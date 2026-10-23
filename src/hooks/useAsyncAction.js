import { useCallback, useRef, useState } from 'react';

// Runs one async action at a time. A second call while one is pending is
// ignored, which prevents duplicate submissions from fast double clicks.
export function useAsyncAction(action) {
  const [state, setState] = useState({ pending: false, error: null, data: null });
  const inFlight = useRef(false);
  const actionRef = useRef(action);
  actionRef.current = action;

  const run = useCallback(async (...args) => {
    if (inFlight.current) return { ok: false, ignored: true };
    inFlight.current = true;
    setState({ pending: true, error: null, data: null });
    try {
      const data = await actionRef.current(...args);
      setState({ pending: false, error: null, data });
      return { ok: true, data };
    } catch (error) {
      setState({ pending: false, error, data: null });
      return { ok: false, error };
    } finally {
      inFlight.current = false;
    }
  }, []);

  const reset = useCallback(() => setState({ pending: false, error: null, data: null }), []);

  return { ...state, run, reset };
}
