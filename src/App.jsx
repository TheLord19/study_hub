import { Route, Routes } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import { ToastHost } from './components/ui.jsx';
import { RefreshProvider, useRefresh, useResource } from './lib/useResource.jsx';
import { api } from './lib/api.js';

import Today from './pages/Today.jsx';
import Ladder from './pages/Ladder.jsx';
import Companies from './pages/Companies.jsx';
import CompanyDetail from './pages/CompanyDetail.jsx';
import Log from './pages/Log.jsx';
import Patterns from './pages/Patterns.jsx';
import Body from './pages/Body.jsx';
import Builds from './pages/Builds.jsx';

function Routed() {
  const { tick } = useRefresh();
  const { data: stats, error } = useResource(() => api.stats(), [tick]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold mb-2">The API is not answering</h1>
          <p className="text-[13.5px] text-ink2 leading-relaxed">
            The page loaded but <code className="font-mono text-accent">/api</code> did not respond.
            Start the server with <code className="font-mono text-accent">npm run dev</code>, which runs
            the API on 5174 and this page on 5173.
          </p>
          <p className="font-mono text-[11.5px] text-ink3 mt-3">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Shell stats={stats}>
      <Routes>
        <Route path="/" element={<Today stats={stats} />} />
        <Route path="/ladder" element={<Ladder />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:slug" element={<CompanyDetail />} />
        <Route path="/log" element={<Log />} />
        <Route path="/patterns" element={<Patterns stats={stats} />} />
        <Route path="/body" element={<Body />} />
        <Route path="/builds" element={<Builds />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <RefreshProvider>
      <ToastHost>
        <Routed />
      </ToastHost>
    </RefreshProvider>
  );
}
