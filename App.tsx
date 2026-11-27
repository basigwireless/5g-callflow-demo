import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, SkipBack, SkipForward, Maximize2, Minimize2, ExternalLink, ArrowRight,
} from 'lucide-react';
import Diagram from './components/Diagram';
import Timeline from './components/Timeline';
import StepList from './components/StepList';
import { STEPS, TOTAL_DURATION, PHASE_BY_ID, NODES, stepIndexAt } from './data/callflow';
import logo from './basig-logo.png';

const SPEEDS = [0.5, 1, 2, 4];

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  // Deep link: #step-12 opens the demo at step 12; #step-12-paused also pauses there.
  const initial = useMemo(() => {
    const m = /^#step-(\d+)(-paused)?$/.exec(window.location.hash);
    if (!m) return { t: 0, playing: true };
    const i = Math.max(1, Math.min(STEPS.length, Number(m[1]))) - 1;
    return { t: STEPS[i].start, playing: !m[2] };
  }, []);
  const [t, setT] = useState(initial.t);
  const [playing, setPlaying] = useState(initial.playing);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const tRef = useRef(initial.t);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  // Single clock that drives everything.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const next = Math.min(TOTAL_DURATION, tRef.current + dt * rateRef.current);
      tRef.current = next;
      setT(next);
      if (next >= TOTAL_DURATION) { setPlaying(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = useCallback((time: number) => {
    const c = Math.max(0, Math.min(TOTAL_DURATION, time));
    tRef.current = c;
    setT(c);
  }, []);

  const stepIndex = stepIndexAt(t);
  const step = STEPS[stepIndex];
  const phase = PHASE_BY_ID[step.phase];
  const stepProgress = Math.min(1, (t - step.start) / step.dur);

  const goStep = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(STEPS.length - 1, i));
    seek(STEPS[idx].start);
  }, [seek]);

  const next = useCallback(() => goStep(stepIndexAt(tRef.current) + 1), [goStep]);
  const prev = useCallback(() => {
    const i = stepIndexAt(tRef.current);
    if (tRef.current - STEPS[i].start > 1.2) goStep(i); else goStep(i - 1);
  }, [goStep]);

  const togglePlay = useCallback(() => {
    if (tRef.current >= TOTAL_DURATION) seek(0);
    setPlaying(p => !p);
  }, [seek]);

  const restart = useCallback(() => { seek(0); setPlaying(true); }, [seek]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Home' || e.key === 'r') restart();
      else if (e.key === 'f') toggleFullscreen();
      else if (e.key === '+' || e.key === '=') setRate(r => SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(r) + 1)]);
      else if (e.key === '-') setRate(r => SPEEDS[Math.max(0, SPEEDS.indexOf(r) - 1)]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, next, prev, restart, toggleFullscreen]);

  const path = step.msg?.path;
  const from = path?.[0];
  const to = path?.[path.length - 1];
  const via = path && path.length > 2 ? path.slice(1, -1) : [];

  const diagram = useMemo(() => <Diagram t={t} stepIndex={stepIndex} />, [t, stepIndex]);

  return (
    <div className="app" style={{ '--phase': phase.color } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="BaSig Wireless Laboratories" className="brand-logo" />
          <span className="brand-divider" />
          <div>
            <h1>5G SA Call Flow Visualizer</h1>
            <p>BaSig Wireless Laboratories</p>
          </div>
        </div>
        <div className="topbar-right">
          <div className="phase-pill">
            <span className="dot" />
            {phase.name}
          </div>
          <button className="icon-btn" onClick={toggleFullscreen} title="Full screen (F)">
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      <div className="body">
        <main className="stage">
          <div className="canvas">{diagram}</div>
        </main>

        <aside className="sidebar">
          <section className="now">
            <div className="now-meta">
              <span className="now-step">Step {stepIndex + 1} <span className="of">/ {STEPS.length}</span></span>
              <span className="now-phase">{phase.name}</span>
            </div>
            <h2>{step.title}</h2>
            {step.msg && (
              <div className="route">
                <span className="node-chip">{NODES[from!].label}</span>
                {via.map(v => (
                  <React.Fragment key={v}>
                    <ArrowRight size={14} className="route-arrow" />
                    <span className="node-chip ghost">{NODES[v].label}</span>
                  </React.Fragment>
                ))}
                <ArrowRight size={14} className="route-arrow" />
                <span className="node-chip">{NODES[to!].label}</span>
                <span className="iface">{step.msg.iface}</span>
              </div>
            )}
            {step.msg && <code className="msg-name">{step.msg.name}</code>}
            <p className="desc">{step.desc}</p>
            <div className="now-foot">
              {step.spec && (
                <a href={step.spec.url} target="_blank" rel="noreferrer" className="spec-link">
                  {step.spec.label} <ExternalLink size={12} />
                </a>
              )}
              <div className="mini-progress"><div style={{ width: `${stepProgress * 100}%` }} /></div>
            </div>
          </section>

          <StepList current={stepIndex} progress={stepProgress} onSelect={goStep} />
        </aside>
      </div>

      <footer className="transport">
        <div className="controls">
          <button className="icon-btn" onClick={prev} title="Previous step (←)"><SkipBack size={18} /></button>
          <button className="play-btn" onClick={togglePlay} title="Play / pause (Space)">
            {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="nudge" />}
          </button>
          <button className="icon-btn" onClick={next} title="Next step (→)"><SkipForward size={18} /></button>
          <button className="icon-btn" onClick={restart} title="Restart (R)"><RotateCcw size={17} /></button>
        </div>

        <span className="time">{fmt(t)}</span>
        <Timeline t={t} onSeek={seek} />
        <span className="time muted">{fmt(TOTAL_DURATION)}</span>

        <div className="speed" role="group" aria-label="Playback speed">
          {SPEEDS.map(s => (
            <button key={s} className={s === rate ? 'active' : ''} onClick={() => setRate(s)}>{s}×</button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
