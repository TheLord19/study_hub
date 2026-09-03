import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* One counter shared by the whole app. Anything that writes calls bump(), and
 * every loader keyed on `tick` refetches. Small enough to reason about, and it
 * keeps pages from having to know who else needs updating. */
const RefreshCtx = createContext({ tick: 0, bump: () => {} });

export function RefreshProvider({ children }) {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);
  const value = useMemo(() => ({ tick, bump }), [tick, bump]);
  return <RefreshCtx.Provider value={value}>{children}</RefreshCtx.Provider>;
}

export const useRefresh = () => useContext(RefreshCtx);

export function useResource(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(loader())
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((error) => live && setState({ data: null, loading: false, error }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
