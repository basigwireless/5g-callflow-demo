import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { PHASES, STEPS } from '../data/callflow';

interface Props {
  current: number;
  progress: number;
  onSelect: (index: number) => void;
}

const StepList: React.FC<Props> = ({ current, progress, onSelect }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-step="${current}"]`);
    const box = listRef.current;
    if (!el || !box) return;
    const top = el.offsetTop - box.offsetTop;
    const target = top - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top: target, behavior: 'smooth' });
  }, [current]);

  return (
    <div className="steps" ref={listRef}>
      {PHASES.map(p => {
        const steps = STEPS.filter(s => s.phase === p.id);
        return (
          <div key={p.id} className="phase-group" style={{ '--c': p.color } as React.CSSProperties}>
            <div className="phase-head">
              <span className="phase-dot" />
              {p.name}
              <span className="phase-count">{steps.length}</span>
            </div>
            {steps.map(s => {
              const state = s.index < current ? 'done' : s.index === current ? 'current' : 'todo';
              return (
                <button
                  key={s.index}
                  data-step={s.index}
                  className={`step ${state}`}
                  onClick={() => onSelect(s.index)}
                >
                  <span className="step-num">
                    {state === 'done' ? <Check size={12} strokeWidth={3} /> : s.index + 1}
                  </span>
                  <span className="step-body">
                    <span className="step-title">{s.title}</span>
                    {s.msg && <span className="step-iface">{s.msg.iface}</span>}
                  </span>
                  {state === 'current' && <span className="step-bar" style={{ width: `${progress * 100}%` }} />}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(StepList);
