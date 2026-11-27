import React, { useRef, useState } from 'react';
import { PHASES, STEPS, TOTAL_DURATION, stepIndexAt } from '../data/callflow';

interface Props {
  t: number;
  onSeek: (t: number) => void;
}

const phaseSpans = PHASES.map(p => {
  const steps = STEPS.filter(s => s.phase === p.id);
  return { phase: p, start: steps[0].start, end: steps[steps.length - 1].end };
});

const Timeline: React.FC<Props> = ({ t, onSeek }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; time: number } | null>(null);
  const dragging = useRef(false);

  const timeAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return { time: f * TOTAL_DURATION, x: f * r.width };
  };

  const pct = (v: number) => `${(v / TOTAL_DURATION) * 100}%`;
  const hoverStep = hover ? STEPS[stepIndexAt(hover.time)] : null;

  return (
    <div
      ref={ref}
      className="timeline"
      role="slider"
      tabIndex={0}
      aria-label="Timeline"
      aria-valuemin={0}
      aria-valuemax={TOTAL_DURATION}
      aria-valuenow={Math.round(t)}
      onPointerDown={e => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onSeek(timeAt(e.clientX).time);
      }}
      onPointerMove={e => {
        const h = timeAt(e.clientX);
        setHover(h);
        if (dragging.current) onSeek(h.time);
      }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerLeave={() => { if (!dragging.current) setHover(null); }}
    >
      <div className="track">
        {phaseSpans.map(({ phase, start, end }) => {
          const fill = Math.max(0, Math.min(1, (t - start) / (end - start)));
          return (
            <div key={phase.id} className="seg" style={{ left: pct(start), width: pct(end - start), '--c': phase.color } as React.CSSProperties}>
              <div className="seg-fill" style={{ width: `${fill * 100}%` }} />
            </div>
          );
        })}
        {STEPS.slice(1).map(s => (
          <div key={s.index} className="tick" style={{ left: pct(s.start) }} />
        ))}
      </div>
      <div className="phase-labels">
        {phaseSpans.map(({ phase, start, end }) => (
          <span key={phase.id} style={{ left: pct(start), width: pct(end - start), color: t >= start ? phase.color : undefined }}>
            {phase.short}
          </span>
        ))}
      </div>
      <div className="playhead" style={{ left: pct(t) }} />
      {hover && hoverStep && (
        <div className="tl-tip" style={{ left: hover.x }}>
          <b>{hoverStep.index + 1}.</b> {hoverStep.title}
        </div>
      )}
    </div>
  );
};

export default Timeline;
