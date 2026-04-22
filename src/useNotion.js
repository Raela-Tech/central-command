// src/useNotion.js
// Drop-in replacement for the static arrays in data.jsx.
// Fetches from /api/tasks, /api/team, /api/waiting and exposes the same
// shape that FlintApp already expects — so no changes needed to app.jsx.
//
// Usage:
//   const { myTasks, waitingOn, team, loading, error, refresh, syncedAt } = useNotion();

const { useState, useEffect, useCallback } = React;

// In production this is '' (same origin). In local dev with `vercel dev` it's also ''.
// If you ever run the frontend separately, set window.API_BASE = 'http://localhost:3000'.
const API_BASE = window.API_BASE || '';

function useFetch(path) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [tick, setTick]     = useState(0);

  const refresh = useCallback(() => setTick(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}${path}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [path, tick]);

  return { data, loading, error, refresh };
}

function useNotion() {
  const tasks   = useFetch('/api/tasks');
  const team    = useFetch('/api/team');
  const waiting = useFetch('/api/waiting');

  const loading = tasks.loading || team.loading || waiting.loading;
  const error   = tasks.error || team.error || waiting.error;

  function refresh() {
    tasks.refresh();
    team.refresh();
    waiting.refresh();
  }

  return {
    // Shape matches the static arrays in data.jsx exactly
    myTasks:   tasks.data?.tasks    ?? [],
    grouped:   tasks.data?.grouped  ?? { Critical: [], High: [], Medium: [] },
    team:      team.data?.team      ?? [],
    waitingOn: waiting.data?.waiting ?? [],

    // Meta
    loading,
    error,
    refresh,
    syncedAt: tasks.data?.meta?.syncedAt ?? null,
  };
}

// Expose globally so app.jsx can consume without a bundler
window.useNotion = useNotion;
