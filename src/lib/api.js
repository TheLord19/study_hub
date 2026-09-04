const base = '/api';

async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return s ? `?${s}` : '';
};

export const api = {
  stats: () => req('GET', '/stats'),
  notebook: () => req('GET', '/stats/notebook'),
  readiness: () => req('GET', '/stats/readiness'),

  solves: (filters) => req('GET', `/solves${qs(filters)}`),
  due: () => req('GET', '/solves/due'),
  stuck: () => req('GET', '/solves/stuck'),
  logSolve: (body) => req('POST', '/solves', body),
  bulkSolves: (body) => req('POST', '/solves/bulk', body),
  review: (id, verdict) => req('POST', `/solves/${id}/review`, { verdict }),
  updateSolve: (id, body) => req('PATCH', `/solves/${id}`, body),
  deleteSolve: (id) => req('DELETE', `/solves/${id}`),

  curriculum: () => req('GET', '/curriculum'),
  nextUp: () => req('GET', '/next-up'),
  companies: () => req('GET', '/companies'),
  company: (slug) => req('GET', `/companies/${slug}`),
  setTarget: (slug, targeted) => req('POST', `/companies/${slug}/target`, { targeted }),

  runs: () => req('GET', '/body/runs'),
  addRun: (body) => req('POST', '/body/runs', body),
  deleteRun: (id) => req('DELETE', `/body/runs/${id}`),
  weights: () => req('GET', '/body/weights'),
  addWeight: (body) => req('POST', '/body/weights', body),
  deleteWeight: (date) => req('DELETE', `/body/weights/${date}`),
  bodySummary: () => req('GET', '/body/summary'),

  prepTracks: () => req('GET', '/prep/tracks'),
  prep: (track) => req('GET', `/prep/${track}`),
  prepDue: () => req('GET', '/prep/due'),
  prepAttempts: (track) => req('GET', `/prep/${track}/attempts`),
  logAttempt: (key, body) => req('POST', `/prep/${key}/attempt`, body),
  deleteAttempt: (id) => req('DELETE', `/prep/attempt/${id}`),

  stories: () => req('GET', '/stories'),
  storyGaps: () => req('GET', '/stories/gaps'),
  addStory: (body) => req('POST', '/stories', body),
  updateStory: (id, body) => req('PATCH', `/stories/${id}`, body),
  deleteStory: (id) => req('DELETE', `/stories/${id}`),
  linkStory: (id, item_key, linked) => req('POST', `/stories/${id}/link`, { item_key, linked }),

  pipeline: () => req('GET', '/pipeline'),
  addApplication: (body) => req('POST', '/pipeline', body),
  updateApplication: (id, body) => req('PATCH', `/pipeline/${id}`, body),
  deleteApplication: (id) => req('DELETE', `/pipeline/${id}`),

  builds: () => req('GET', '/builds'),
  addBuild: (body) => req('POST', '/builds', body),
  updateBuild: (id, body) => req('PATCH', `/builds/${id}`, body),
  deleteBuild: (id) => req('DELETE', `/builds/${id}`),

  settings: () => req('GET', '/settings'),
  saveSettings: (body) => req('PUT', '/settings', body)
};
