import { useState, useEffect, useRef, useCallback } from 'react';
import { createSorter } from './algorithms';
import { themes } from './themes';

const ALGO_NAMES = {
  bubble:    'Bubble Sort      O(n²)',
  selection: 'Selection Sort   O(n²)',
  insertion: 'Insertion Sort   O(n²)',
  merge:     'Merge Sort       O(n log n)',
  quick:     'Quick Sort       O(n log n)',
  heap:      'Heap Sort        O(n log n)',
  shell:     'Shell Sort       O(n log² n)',
  counting:  'Counting Sort    O(n + k)',
};

const SPEED_OPTIONS = [
  { label: 'SLOW',    ms: 200 },
  { label: 'NORMAL',  ms: 50  },
  { label: 'FAST',    ms: 10  },
  { label: 'EXTREME', ms: 1   },
];

function makeArray(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

function drawBars(canvas, array, highlights, sortedSet, theme) {
  if (!canvas || !array.length) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  if (!W || !H) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = (H / 5) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const n = array.length;
  const maxVal = Math.max(...array);
  const gap = n > 100 ? 0 : n > 50 ? 1 : 2;
  const barW = Math.max(1, (W - gap * (n - 1)) / n);
  const pad = 10;

  for (let i = 0; i < n; i++) {
    const barH = (array[i] / maxVal) * (H - pad);
    const x = i * (barW + gap);
    const y = H - barH;

    let type = 'default';
    if (sortedSet.has(i)) type = 'sorted';
    if (highlights[i]) type = highlights[i];

    const color = theme.colors[type] || theme.colors.default;

    if (type !== 'default' && type !== 'sorted') {
      ctx.shadowColor = color;
      ctx.shadowBlur = barW < 3 ? 4 : 10;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW, barH);

    if (barW > 4 && type === 'default') {
      ctx.strokeStyle = theme.colors.default_border;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, barH - 1);
    }
  }
  ctx.shadowBlur = 0;
}

function useVisualizer(theme) {
  const canvasRef     = useRef(null);
  const wrapperRef    = useRef(null);
  const arrayRef      = useRef([]);
  const highlightsRef = useRef({});
  const sortedSetRef  = useRef(new Set());
  const themeRef      = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  const redraw = useCallback(() => {
    drawBars(canvasRef.current, arrayRef.current, highlightsRef.current, sortedSetRef.current, themeRef.current);
  }, []);

  const initCanvas = useCallback(() => {
    const el = wrapperRef.current;
    const c  = canvasRef.current;
    if (!el || !c) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    c.width  = width  * dpr;
    c.height = height * dpr;
    c.style.width  = width  + 'px';
    c.style.height = height + 'px';
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    redraw();
  }, [redraw]);

  useEffect(() => {
    // defer so DOM has painted and wrapper has real dimensions
    const t = setTimeout(initCanvas, 50);
    const el = wrapperRef.current;
    if (!el) return () => clearTimeout(t);
    const obs = new ResizeObserver(initCanvas);
    obs.observe(el);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [initCanvas]);

  useEffect(() => { redraw(); }, [theme, redraw]);

  return { canvasRef, wrapperRef, arrayRef, highlightsRef, sortedSetRef, redraw };
}

function CtrlGroup({ label, children, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 9, letterSpacing: 2, color: theme.ui.textDim, textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Stat({ label, value, theme }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: theme.ui.textDim, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>{label}</span>
      <span style={{ color: theme.ui.accent, fontSize: 11 }}>{value}</span>
    </div>
  );
}

function VizPanel({ canvasRef, wrapperRef, label, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      {label && (
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, color: theme.ui.accent }}>
          {label}
        </div>
      )}
      <div
        ref={wrapperRef}
        style={{
          flex: 1,
          position: 'relative',
          background: theme.ui.panel,
          border: `1px solid ${theme.ui.border}`,
          minHeight: 400,
          overflow: 'hidden',
        }}
      >
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

export default function SortVisualizer() {
  const [themeName,   setThemeName]   = useState(Object.keys(themes)[0]);
  const theme = themes[themeName];

  const [running,     setRunning]     = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [algo,        setAlgo]        = useState('bubble');
  const [algo2,       setAlgo2]       = useState('quick');
  const [size,        setSize]        = useState(60);
  const [speed,       setSpeed]       = useState(50);
  const [stats,       setStats]       = useState({ comparisons: 0, swaps: 0, elapsed: 0 });
  const [stats2,      setStats2]      = useState({ comparisons: 0, swaps: 0, elapsed: 0 });
  const [statusMsg,   setStatusMsg]   = useState('Ready — press GO to begin sorting');
  const [statusType,  setStatusType]  = useState('idle');

  const stopRef   = useRef(false);
  const delayRef  = useRef(50);
  const statsRef  = useRef({ comparisons: 0, swaps: 0 });
  const statsRef2 = useRef({ comparisons: 0, swaps: 0 });
  const timerRef  = useRef(null);
  const startRef  = useRef(0);

  const viz1 = useVisualizer(theme);
  const viz2 = useVisualizer(theme);

  useEffect(() => { delayRef.current = speed; }, [speed]);

  const generate = useCallback((n) => {
    const count = Math.max(5, Math.min(500, n || 60));
    const arr = makeArray(count);
    viz1.arrayRef.current      = [...arr];
    viz1.highlightsRef.current = {};
    viz1.sortedSetRef.current  = new Set();
    viz2.arrayRef.current      = [...arr];
    viz2.highlightsRef.current = {};
    viz2.sortedSetRef.current  = new Set();
    statsRef.current  = { comparisons: 0, swaps: 0 };
    statsRef2.current = { comparisons: 0, swaps: 0 };
    setStats({  comparisons: 0, swaps: 0, elapsed: 0 });
    setStats2({ comparisons: 0, swaps: 0, elapsed: 0 });
    setStatusMsg('Ready — press GO to begin sorting');
    setStatusType('idle');
    viz1.redraw();
    viz2.redraw();
  }, [viz1, viz2]);

  useEffect(() => { generate(60); }, []);
  useEffect(() => {
    if (compareMode) generate(size);
  }, [compareMode]);

  const runSort = useCallback(async () => {
    if (running) return;
    stopRef.current = false;
    setRunning(true);
    setStatusType('running');
    statsRef.current  = { comparisons: 0, swaps: 0 };
    statsRef2.current = { comparisons: 0, swaps: 0 };
    startRef.current  = Date.now();

    setStatusMsg(compareMode
      ? `${ALGO_NAMES[algo]}  vs  ${ALGO_NAMES[algo2]} — running...`
      : `${ALGO_NAMES[algo]} — running...`
    );

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setStats({  comparisons: statsRef.current.comparisons,  swaps: statsRef.current.swaps,  elapsed });
      setStats2({ comparisons: statsRef2.current.comparisons, swaps: statsRef2.current.swaps, elapsed });
    }, 80);

    const algos1 = createSorter(viz1.arrayRef.current, statsRef,  stopRef, delayRef, (a, hi, s) => {
      viz1.arrayRef.current = a; viz1.highlightsRef.current = hi; viz1.sortedSetRef.current = s; viz1.redraw();
    });
    const algos2 = createSorter(viz2.arrayRef.current, statsRef2, stopRef, delayRef, (a, hi, s) => {
      viz2.arrayRef.current = a; viz2.highlightsRef.current = hi; viz2.sortedSetRef.current = s; viz2.redraw();
    });

    try {
      if (compareMode) {
        await Promise.all([algos1[algo](), algos2[algo2]()]);
      } else {
        await algos1[algo]();
      }

      viz1.highlightsRef.current = {};
      viz2.highlightsRef.current = {};
      viz1.redraw();
      viz2.redraw();
      clearInterval(timerRef.current);

      const elapsed = Date.now() - startRef.current;
      setStatusType('done');
      setStatusMsg(compareMode
        ? `${ALGO_NAMES[algo]}: ${statsRef.current.comparisons.toLocaleString()} cmps / ${statsRef.current.swaps.toLocaleString()} swaps  |  ${ALGO_NAMES[algo2]}: ${statsRef2.current.comparisons.toLocaleString()} cmps / ${statsRef2.current.swaps.toLocaleString()} swaps  —  ${elapsed}ms`
        : `${ALGO_NAMES[algo]} — completed in ${elapsed}ms · ${statsRef.current.comparisons.toLocaleString()} comparisons · ${statsRef.current.swaps.toLocaleString()} swaps`
      );
      setStats({  comparisons: statsRef.current.comparisons,  swaps: statsRef.current.swaps,  elapsed });
      setStats2({ comparisons: statsRef2.current.comparisons, swaps: statsRef2.current.swaps, elapsed });

    } catch (e) {
      clearInterval(timerRef.current);
      if (e.message === 'STOPPED') {
        setStatusType('stopped');
        setStatusMsg('Stopped — press RESET to start over');
      }
    }

    setRunning(false);
  }, [running, algo, algo2, compareMode, viz1, viz2]);

  const reset = useCallback(() => {
    stopRef.current = true;
    clearInterval(timerRef.current);
    setRunning(false);
    generate(size);
  }, [generate, size]);

  const handleSizeChange = (v) => {
    const n = Math.max(5, Math.min(500, parseInt(v) || 60));
    setSize(n);
    if (!running) generate(n);
  };

  const statusColor = {
    running: theme.ui.accent,
    done:    theme.colors.sorted,
    stopped: theme.colors.compare,
    idle:    theme.ui.textDim,
  }[statusType];

  const inputStyle = {
    background: theme.ui.bg,
    border: `1px solid ${theme.ui.border}`,
    color: theme.ui.accent,
    fontFamily: theme.font || "'Share Tech Mono', monospace",
    fontSize: 13,
    padding: '8px 12px',
  };

  return (
    <div style={{ background: theme.ui.bg, color: theme.ui.text, fontFamily: theme.font || "'Share Tech Mono', monospace", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div className="scanlines" />

      {/* Header */}
      <header style={{ padding: '24px 40px 16px', borderBottom: `1px solid ${theme.ui.border}`, display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <h1 className="sort-h1" style={{ fontFamily: theme.displayFont || "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 6, color: theme.ui.accent, textShadow: `0 0 30px ${theme.ui.accentGlow}`, lineHeight: 1 }}>
          SORT
        </h1>
        <span style={{ fontSize: 11, color: theme.ui.textDim, letterSpacing: 3, textTransform: 'uppercase' }}>
          // algorithm visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 9, letterSpacing: 2, color: theme.ui.textDim, textTransform: 'uppercase' }}>Theme</label>
          <select value={themeName} onChange={e => setThemeName(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
            {Object.entries(themes).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
          </select>
        </div>
      </header>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 40px', borderBottom: `1px solid ${theme.ui.border}`, background: theme.ui.panel, flexWrap: 'wrap' }}>

        <CtrlGroup label={compareMode ? 'Algorithm 1' : 'Algorithm'} theme={theme}>
          <select value={algo} disabled={running} onChange={e => setAlgo(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
            {Object.entries(ALGO_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </CtrlGroup>

        {compareMode && (
          <CtrlGroup label="Algorithm 2" theme={theme}>
            <select value={algo2} disabled={running} onChange={e => setAlgo2(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
              {Object.entries(ALGO_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </CtrlGroup>
        )}

        <CtrlGroup label="Array Size" theme={theme}>
          <input type="number" value={size} min={5} max={500} disabled={running}
            onChange={e => handleSizeChange(e.target.value)}
            style={{ ...inputStyle, width: 90 }} />
        </CtrlGroup>

        <CtrlGroup label="Speed" theme={theme}>
          <div style={{ display: 'flex', gap: 2 }}>
            {SPEED_OPTIONS.map(opt => (
              <button key={opt.ms} className="speed-btn" onClick={() => setSpeed(opt.ms)}
                style={{
                  background:  speed === opt.ms ? theme.ui.accent : theme.ui.bg,
                  border:      '1px solid',
                  borderColor: speed === opt.ms ? theme.ui.accent : theme.ui.border,
                  color:       speed === opt.ms ? theme.ui.bg     : theme.ui.textDim,
                  fontFamily:  theme.font || "'Share Tech Mono', monospace",
                  fontSize: 11, padding: '7px 10px', cursor: 'pointer', letterSpacing: 1, transition: 'all 0.15s',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </CtrlGroup>

        <button className="btn-compare" onClick={() => { if (!running) setCompareMode(m => !m); }}
          style={{
            fontFamily: theme.font || "'Share Tech Mono', monospace",
            fontSize: 11, letterSpacing: 2, padding: '8px 16px',
            cursor: running ? 'not-allowed' : 'pointer', marginTop: 8,
            background:  compareMode ? theme.colors.pivot : 'transparent',
            color:       compareMode ? theme.ui.bg        : theme.colors.pivot,
            border:      `1px solid ${theme.colors.pivot}`,
            textTransform: 'uppercase', transition: 'all 0.15s', opacity: running ? 0.5 : 1,
          }}>
          {compareMode ? '⇌ Compare ON' : '⇌ Compare'}
        </button>

        <button className="btn-go" onClick={runSort} disabled={running}
          style={{ border: 'none', fontFamily: theme.displayFont || "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, padding: '8px 28px', cursor: running ? 'not-allowed' : 'pointer', transition: 'all 0.15s', marginTop: 8, background: theme.ui.accent, color: theme.ui.bg, opacity: running ? 0.4 : 1 }}>
          GO
        </button>

        <button className="btn-reset" onClick={reset}
          style={{ fontFamily: theme.displayFont || "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, padding: '8px 28px', cursor: 'pointer', transition: 'all 0.15s', marginTop: 8, background: 'transparent', color: theme.colors.compare, border: `1px solid ${theme.colors.compare}` }}>
          RESET
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 32, padding: '10px 40px', background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${theme.ui.border}`, fontSize: 11, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {compareMode && <span style={{ color: theme.ui.accent, fontSize: 10, letterSpacing: 2 }}>{ALGO_NAMES[algo].toUpperCase()}</span>}
          <Stat label="Comparisons" value={stats.comparisons.toLocaleString()} theme={theme} />
          <Stat label="Swaps"       value={stats.swaps.toLocaleString()}       theme={theme} />
          <Stat label="Time"        value={`${stats.elapsed}ms`}               theme={theme} />
        </div>
        {compareMode && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', borderLeft: `1px solid ${theme.ui.border}`, paddingLeft: 24 }}>
            <span style={{ color: theme.colors.pivot, fontSize: 10, letterSpacing: 2 }}>{ALGO_NAMES[algo2].toUpperCase()}</span>
            <Stat label="Comparisons" value={stats2.comparisons.toLocaleString()} theme={theme} />
            <Stat label="Swaps"       value={stats2.swaps.toLocaleString()}       theme={theme} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { key: 'default', border: true },
            { key: 'active'  },
            { key: 'compare' },
            { key: 'pivot'   },
            { key: 'sorted'  },
          ].map(({ key, border }) => (
            <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: theme.ui.textDim }}>
              <div style={{ width: 10, height: 10, background: theme.colors[key], border: border ? `1px solid ${theme.colors.default_border}` : 'none' }} />
              <span>{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visualizer */}
      <div style={{ flex: 1, padding: '20px 40px 30px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: compareMode ? '1fr 1fr' : '1fr',
          gap: 16,
          minHeight: 0,
        }}>
          <VizPanel canvasRef={viz1.canvasRef} wrapperRef={viz1.wrapperRef} label={compareMode ? ALGO_NAMES[algo] : null} theme={theme} />
          {compareMode && (
            <VizPanel canvasRef={viz2.canvasRef} wrapperRef={viz2.wrapperRef} label={ALGO_NAMES[algo2]} theme={theme} />
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, letterSpacing: 1, minHeight: 18, color: statusColor }}>
          {statusMsg}
        </div>
      </div>

    </div>
  );
}