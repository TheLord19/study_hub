import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', label: 'Today', end: true },
  { to: '/ladder', label: 'Ladder' },
  { to: '/companies', label: 'Companies' },
  { to: '/log', label: 'Log' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/body', label: 'Body' },
  { to: '/builds', label: 'Builds' }
];

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('grindlog.theme') ?? 'dark'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('grindlog.theme', theme); } catch { /* private mode */ }
  }, [theme]);
  return [theme, setTheme];
}

function StreakChip({ streak }) {
  if (!streak) return null;
  const risk = streak.risk && streak.days > 0;
  return (
    <div
      className={`flex items-baseline gap-1.5 font-mono text-[11.5px] border rounded-full px-3 py-1
        ${risk ? 'border-hint text-hint' : 'border-line text-ink2'}`}
      title={risk ? "Yesterday's streak is still alive — solve something today to keep it" : 'Consecutive days with a solve'}
    >
      <span>{risk ? 'at risk' : 'streak'}</span>
      <b className={`text-[13px] font-bold ${risk ? 'text-hint' : 'text-ink'}`}>{streak.days}</b>
      <span>d</span>
    </div>
  );
}

export default function Shell({ stats, children }) {
  const [theme, setTheme] = useTheme();

  const link = ({ isActive }) =>
    `block px-3 py-2 rounded text-[13.5px] font-semibold transition-colors border-l-2 -ml-px
     ${isActive
       ? 'text-ink border-accent bg-raised'
       : 'text-ink3 border-transparent hover:text-ink hover:bg-raised/60'}`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[212px_1fr]">
      {/* --- rail --- */}
      <aside className="lg:h-screen lg:sticky lg:top-0 border-b lg:border-b-0 lg:border-r border-line bg-ground flex flex-col">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-baseline gap-2">
            <span className="w-[7px] h-[7px] rounded-full bg-accent translate-y-[-2px]" />
            <span className="font-bold uppercase tracking-[0.015em] text-[16px]" style={{ fontStretch: '112%' }}>
              Grind Log
            </span>
          </div>
          <div className="font-mono text-[10px] text-ink3 mt-1 ml-[15px]">dsa · companies · body</div>
        </div>

        <nav className="px-4 flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 border-l border-line lg:border-l-0 ml-4 lg:ml-0">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden lg:flex flex-col gap-3 px-5 py-5 border-t border-line">
          <StreakChip streak={stats?.streak} />
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="font-mono text-[11px] text-ink3 hover:text-ink text-left transition-colors"
          >
            {theme === 'dark' ? 'switch to light' : 'switch to dark'}
          </button>
        </div>
      </aside>

      {/* --- content --- */}
      <div className="min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-5 py-3 border-b border-line">
          <StreakChip streak={stats?.streak} />
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="ml-auto font-mono text-[11px] text-ink3 hover:text-ink"
          >
            {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>
        <main className="max-w-shell mx-auto px-5 sm:px-7 py-7 pb-24">{children}</main>
      </div>
    </div>
  );
}
