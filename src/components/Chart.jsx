import { useState } from 'react';
import { shortDate } from '../lib/format.js';

/* Hand-rolled so both themes come from the same tokens as the rest of the app
 * and nothing ships a second charting runtime.
 *
 * Rules held to deliberately: one y-scale per chart (weight and mileage are
 * separate charts, never overlaid on twin axes), every axis label names a value
 * the data actually reaches, text wears ink tokens rather than the series
 * colour, and each chart carries a table view underneath for the cases where a
 * picture is the wrong medium.
 */

const PAD = { l: 44, r: 48, t: 14, b: 24 };
const W = 720;

function niceTicks(min, max, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min - 1, min, min + 1];
  const span = max - min;
  const raw = span / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const start = Math.floor(min / step) * step;
  const out = [];
  for (let v = start; v <= max + step * 0.001; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

function Frame({ children, table }) {
  return (
    <div>
      <div className="relative w-full">{children}</div>
      {table && (
        <details className="mt-2 group">
          <summary className="font-mono text-[10.5px] text-ink3 hover:text-ink cursor-pointer list-none">
            ▸ see the numbers
          </summary>
          <div className="mt-2 max-h-52 overflow-auto border border-line rounded">
            <table className="w-full text-[12px]">
              <tbody>{table}</tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ line chart -- */

export function LineChart({ points, unit = '', height = 200, color = 'rgb(var(--c-accent))', label }) {
  const [hover, setHover] = useState(null);

  if (!points?.length) {
    return <div className="border border-dashed border-line rounded px-4 py-8 text-center text-[13px] text-ink3">
      Nothing logged yet.
    </div>;
  }

  const H = height;
  const ys = points.map((p) => p.y);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const ticks = niceTicks(lo, hi, 4);
  const yMin = Math.min(lo, ticks[0]);
  const yMax = Math.max(hi, ticks[ticks.length - 1]);
  const span = yMax - yMin || 1;

  const px = (i) => PAD.l + (points.length === 1 ? 0 : (i / (points.length - 1)) * (W - PAD.l - PAD.r));
  const py = (v) => PAD.t + (1 - (v - yMin) / span) * (H - PAD.t - PAD.b);

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const area = `${line} L${px(points.length - 1).toFixed(1)},${py(yMin)} L${px(0).toFixed(1)},${py(yMin)} Z`;
  const last = points[points.length - 1];
  const gid = `g-${label?.replace(/\W/g, '') ?? 'x'}`;

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - box.left) / box.width) * W;
    const t = (rel - PAD.l) / Math.max(W - PAD.l - PAD.r, 1);
    const i = Math.max(0, Math.min(points.length - 1, Math.round(t * (points.length - 1))));
    setHover(i);
  }

  return (
    <Frame
      table={points.slice().reverse().map((p) => (
        <tr key={p.x} className="border-b border-lineSoft last:border-0">
          <td className="px-2.5 py-1 font-mono text-ink3">{p.x}</td>
          <td className="px-2.5 py-1 text-right tabular-nums">{p.y}{unit}</td>
        </tr>
      ))}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        style={{ height: 'auto' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${label ?? 'Series'} over time`}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* recessive grid — never competes with the data */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)}
              stroke="rgb(var(--c-line))" strokeWidth="1" shapeRendering="crispEdges"
            />
            <text
              x={PAD.l - 8} y={py(t) + 3.5} textAnchor="end"
              fill="rgb(var(--c-ink-3))" fontSize="10.5" fontFamily="JetBrains Mono, monospace"
            >
              {t}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* endpoint is the only point labelled directly */}
        <circle cx={px(points.length - 1)} cy={py(last.y)} r="4.5" fill={color}
                stroke="rgb(var(--c-surface))" strokeWidth="2" />
        <text
          x={px(points.length - 1) + 9} y={py(last.y) + 4}
          fill="rgb(var(--c-ink))" fontSize="12" fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          {last.y}{unit}
        </text>

        {/* x ends only — a label under every point is noise */}
        <text x={PAD.l} y={H - 6} fill="rgb(var(--c-ink-3))" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
          {shortDate(points[0].x)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.r} y={H - 6} textAnchor="end" fill="rgb(var(--c-ink-3))" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
            {shortDate(last.x)}
          </text>
        )}

        {hover != null && (
          <g pointerEvents="none">
            <line x1={px(hover)} x2={px(hover)} y1={PAD.t} y2={H - PAD.b}
                  stroke="rgb(var(--c-ink-3))" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={px(hover)} cy={py(points[hover].y)} r="5.5" fill={color}
                    stroke="rgb(var(--c-surface))" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover != null && (
        <div
          className="absolute -translate-x-1/2 -top-1 pointer-events-none bg-ink text-ground
                     px-2 py-1 rounded font-mono text-[11px] whitespace-nowrap"
          style={{ left: `${(px(hover) / W) * 100}%` }}
        >
          {shortDate(points[hover].x)} · {points[hover].y}{unit}
        </div>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------- bar chart -- */

export function BarChart({ bars, unit = '', height = 170, color = 'rgb(var(--c-accent))', label }) {
  const [hover, setHover] = useState(null);

  if (!bars?.length) {
    return <div className="border border-dashed border-line rounded px-4 py-8 text-center text-[13px] text-ink3">
      Nothing logged yet.
    </div>;
  }

  const H = height;
  const hi = Math.max(...bars.map((b) => b.y), 1);
  const ticks = niceTicks(0, hi, 3);
  const yMax = Math.max(hi, ticks[ticks.length - 1]);

  const inner = W - PAD.l - PAD.r;
  const slot = inner / bars.length;
  const bw = Math.max(4, slot - 2); // 2px surface gap between adjacent bars
  const py = (v) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);

  return (
    <Frame
      table={bars.slice().reverse().map((b) => (
        <tr key={b.x} className="border-b border-lineSoft last:border-0">
          <td className="px-2.5 py-1 font-mono text-ink3">{b.label ?? b.x}</td>
          <td className="px-2.5 py-1 text-right tabular-nums">{b.y}{unit}</td>
        </tr>
      ))}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height: 'auto' }}
           role="img" aria-label={`${label ?? 'Series'} by week`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)}
                  stroke="rgb(var(--c-line))" strokeWidth="1" shapeRendering="crispEdges" />
            <text x={PAD.l - 8} y={py(t) + 3.5} textAnchor="end"
                  fill="rgb(var(--c-ink-3))" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
              {t}
            </text>
          </g>
        ))}

        {bars.map((b, i) => {
          const x = PAD.l + i * slot + (slot - bw) / 2;
          const y = py(b.y);
          const h = Math.max(b.y > 0 ? 2 : 0, H - PAD.b - y);
          return (
            <g key={b.x} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={PAD.t} width={bw} height={H - PAD.b - PAD.t} fill="transparent" />
              <rect
                x={x} y={y} width={bw} height={h}
                rx="3" fill={color}
                opacity={hover == null || hover === i ? 1 : 0.55}
              />
            </g>
          );
        })}

        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b}
              stroke="rgb(var(--c-line))" strokeWidth="1" shapeRendering="crispEdges" />

        <text x={PAD.l} y={H - 6} fill="rgb(var(--c-ink-3))" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
          {bars[0].label ?? bars[0].x}
        </text>
        {bars.length > 1 && (
          <text x={W - PAD.r} y={H - 6} textAnchor="end" fill="rgb(var(--c-ink-3))" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
            {bars[bars.length - 1].label ?? bars[bars.length - 1].x}
          </text>
        )}
      </svg>

      {hover != null && (
        <div
          className="absolute -translate-x-1/2 -top-1 pointer-events-none bg-ink text-ground
                     px-2 py-1 rounded font-mono text-[11px] whitespace-nowrap"
          style={{ left: `${((PAD.l + hover * slot + slot / 2) / W) * 100}%` }}
        >
          {bars[hover].label ?? bars[hover].x} · {bars[hover].y}{unit}
        </div>
      )}
    </Frame>
  );
}
