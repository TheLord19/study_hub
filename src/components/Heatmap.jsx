import { useEffect, useRef } from 'react';
import { todayYmd, monthLabel } from '../lib/format.js';

const WEEKS = 26;
const LEVELS = ['--c-line', '--c-accent', '--c-accent', '--c-accent', '--c-accent'];
const OPACITY = [1, 0.28, 0.5, 0.75, 1];

function level(n) {
  if (!n) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n <= 4) return 3;
  return 4;
}

export default function Heatmap({ data }) {
  const wrap = useRef(null);
  const counts = new Map((data ?? []).map((d) => [d.date, d.n]));

  useEffect(() => {
    if (wrap.current) wrap.current.scrollLeft = wrap.current.scrollWidth;
  }, [data]);

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));

  const cols = [];
  let total = 0;

  for (let w = 0; w < WEEKS; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(cur.getDate() + w * 7 + d);
      const key = todayYmd(cur);
      const n = counts.get(key) ?? 0;
      total += n;
      const lv = level(n);
      cells.push(
        <div
          key={key}
          title={`${key} — ${n} solved`}
          className="w-3 h-3 rounded-sm"
          style={{
            background: `rgb(var(${LEVELS[lv]}))`,
            opacity: cur > now ? 0.25 : OPACITY[lv]
          }}
        />
      );
    }
    cols.push(<div key={w} className="flex flex-col gap-[3px]">{cells}</div>);
  }

  // month strip, built alongside so the labels line up with their columns
  const months = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const colStart = new Date(start);
    colStart.setDate(colStart.getDate() + w * 7);
    const show = colStart.getMonth() !== lastMonth;
    if (show) lastMonth = colStart.getMonth();
    months.push(
      <span key={w} className="w-3 shrink-0 font-mono text-[9.5px] text-ink3 whitespace-nowrap overflow-visible">
        {show ? monthLabel(colStart) : ''}
      </span>
    );
  }

  return (
    <div>
      <div ref={wrap} className="overflow-x-auto pb-1">
        <div className="w-max">
          <div className="flex gap-[3px] mb-1.5">{months}</div>
          <div className="flex gap-[3px]">{cols}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 font-mono text-[10.5px] text-ink3">
        <span>none</span>
        {LEVELS.map((v, i) => (
          <span key={i} className="w-[11px] h-[11px] rounded-sm block"
                style={{ background: `rgb(var(${v}))`, opacity: OPACITY[i] }} />
        ))}
        <span>5+</span>
        <span className="ml-auto">{total} solved in this window</span>
      </div>
    </div>
  );
}
