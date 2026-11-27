import React from 'react';
import {
  NODES, NodeId, NODE_W, NODE_H, BUS_Y, CORE_NFS, NODE_START, PHASE_BY_ID,
  STEPS, UP_HEADERS, Pt, StackLayer, StackItem, LAYER_SPECS,
} from '../data/callflow';
import { activeMessages, MsgState, encapState, clamp01 } from '../data/motion';

interface DiagramProps {
  t: number;
  stepIndex: number;
}

const toPoints = (pts: Pt[]) => pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// ---------- Topology pieces ----------

const StaticLinks: React.FC = () => (
  <g className="links">
    {/* Core frame */}
    <rect x={30} y={18} width={940} height={204} rx={16} className="core-frame" />
    <text x={48} y={40} className="frame-title">5G CORE · SERVICE-BASED ARCHITECTURE</text>

    {/* SBI bus */}
    <line x1={70} y1={BUS_Y} x2={950} y2={BUS_Y} className="bus" />
    <text x={74} y={BUS_Y - 8} className="link-label strong">SBI · HTTP/2</text>
    {CORE_NFS.map(id => {
      const n = NODES[id];
      const y = n.row === 'top' ? n.y + NODE_H / 2 : n.y - NODE_H / 2;
      return <line key={id} x1={n.x} y1={y} x2={n.x} y2={BUS_Y} className="stub" />;
    })}
    {CORE_NFS.map(id => <circle key={id} cx={NODES[id].x} cy={BUS_Y} r={3} className="bus-dot" />)}

    {/* Reference points */}
    <line x1={330} y1={202} x2={330} y2={278} className="ref" />
    <text x={340} y={246} className="link-label"><tspan className="strong">N2</tspan> · NGAP</text>

    <line x1={610} y1={202} x2={610} y2={278} className="ref" />
    <text x={620} y={246} className="link-label"><tspan className="strong">N4</tspan> · PFCP</text>

    <line x1={390} y1={300} x2={550} y2={300} className="ref" />
    <text x={470} y={290} textAnchor="middle" className="link-label"><tspan className="strong">N3</tspan> · GTP-U</text>

    <line x1={670} y1={300} x2={836} y2={300} className="ref" />
    <text x={753} y={290} textAnchor="middle" className="link-label"><tspan className="strong">N6</tspan></text>

    <Wave x1={174} x2={266} y={300} />
    <text x={220} y={288} textAnchor="middle" className="link-label"><tspan className="strong">Uu</tspan> · NR</text>
  </g>
);

/** Sine-wave line used for the radio (air) interface. */
const Wave: React.FC<{ x1: number; x2: number; y: number }> = ({ x1, x2, y }) => {
  const pts: string[] = [];
  const amp = 4, period = 14;
  for (let x = x1; x <= x2; x += 1) pts.push(`${x},${(y + amp * Math.sin(((x - x1) / period) * Math.PI * 2)).toFixed(2)}`);
  return <polyline points={pts.join(' ')} className="wave" />;
};

interface NodeVisual {
  role: 'endpoint' | 'relay' | null;
  color: string;
}

const NodeBox: React.FC<{ id: NodeId; t: number; vis: NodeVisual }> = ({ id, t, vis }) => {
  const n = NODES[id];
  const start = NODE_START[id] ?? 0;
  const on = t >= start;
  const boot = on ? clamp01((t - start) / 1.6) : 1;
  const x = n.x - NODE_W / 2, y = n.y - NODE_H / 2;
  const cls = ['node', on ? 'on' : 'off', vis.role ? `is-${vis.role}` : ''].join(' ');
  const style = { '--hl': vis.color } as React.CSSProperties;

  const body = id === 'DN' ? (
    <g className={cls} style={style}>
      <circle cx={n.x} cy={n.y} r={24} className="node-shape" />
      <text x={n.x} y={n.y + 4} textAnchor="middle" className="node-label">DN</text>
      <text x={n.x} y={n.y + 40} textAnchor="middle" className="node-sub">Data network</text>
    </g>
  ) : (
    <g className={cls} style={style}>
      {on && boot < 1 && (
        <rect x={x - 10 * boot} y={y - 10 * boot} width={NODE_W + 20 * boot} height={NODE_H + 20 * boot}
          rx={12 + 6 * boot} className="boot-ring" style={{ opacity: 1 - boot }} />
      )}
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10} className="node-shape" />
      <circle cx={x + NODE_W - 11} cy={y + 11} r={3.5} className="status-dot" />
      <text x={n.x} y={n.y - 1} textAnchor="middle" className="node-label">{n.label}</text>
      <text x={n.x} y={n.y + 13} textAnchor="middle" className="node-sub">{n.sub}</text>
    </g>
  );

  if (!n.spec) return body;
  return (
    <a href={n.spec.url} target="_blank" rel="noreferrer" className="node-link">
      <title>{`${n.label} — ${n.sub}. Open ${n.spec.label}`}</title>
      {body}
    </a>
  );
};

// ---------- Messages ----------

function arrowHead(pts: Pt[], color: string) {
  const b = pts[pts.length - 1];
  let a = pts[pts.length - 2] ?? b;
  for (let i = pts.length - 2; i >= 0 && a[0] === b[0] && a[1] === b[1]; i--) a = pts[i];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const s = 9;
  const p1: Pt = [b[0] - s * Math.cos(ang - 0.45), b[1] - s * Math.sin(ang - 0.45)];
  const p2: Pt = [b[0] - s * Math.cos(ang + 0.45), b[1] - s * Math.sin(ang + 0.45)];
  return <polygon points={toPoints([b, p1, p2])} fill={color} />;
}

const MessagePath: React.FC<{ m: MsgState; t: number }> = ({ m, t }) => {
  const color = PHASE_BY_ID[m.step.phase].color;
  const lastDrawn = m.drawn[m.drawn.length - 1];
  return (
    <g style={{ opacity: m.alpha }}>
      {m.geom.segments.map((s, i) => (
        <polyline key={`g${i}`} points={toPoints(s.pts)} className="msg-ghost" stroke={color} />
      ))}
      {m.drawn.map((pts, i) => (
        <g key={`d${i}`}>
          <polyline points={toPoints(pts)} className="msg-line" stroke={color} />
          <polyline points={toPoints(pts)} className="msg-flow" style={{ strokeDashoffset: -t * 36 }} />
        </g>
      ))}
      {m.arrived ? arrowHead(lastDrawn, color) : (
        <g>
          <circle cx={m.head[0]} cy={m.head[1]} r={12} fill={color} opacity={0.18} className="pulse" />
          <circle cx={m.head[0]} cy={m.head[1]} r={6} fill={color} stroke="white" strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

const MessageLabel: React.FC<{ m: MsgState }> = ({ m }) => {
  const color = PHASE_BY_ID[m.step.phase].color;
  const text = m.step.msg!.label;
  const w = text.length * 6.3 + 22;
  const [lx, ly] = m.geom.labelAt;
  // Vertical runs: label to the left. RAN-row horizontals: label in the gap above the boxes.
  let x = m.geom.labelVertical ? lx - 12 - w : lx - w / 2;
  let y = m.geom.labelVertical ? ly - 11 : ly >= 290 ? 236 : ly - 26;
  // keep inside the canvas
  x = Math.max(8, Math.min(992 - w, x));
  y = Math.max(4, y);
  return (
    <g style={{ opacity: m.alpha }} className="msg-label">
      <rect x={x} y={y} width={w} height={22} rx={11} fill={color} />
      <text x={x + w / 2} y={y + 15} textAnchor="middle">{text}</text>
    </g>
  );
};

// ---------- Protocol stack panel ----------

const ROW_H = 26;
const STACK_W = 170;
const STACK_TOP = 408;
const UE_X = 70;
const GNB_X = 330;

type Cell = { layer: StackLayer; x: number; y: number; w: number; h: number; sub?: string };

const ueCells: Cell[] = [
  { layer: 'NAS', x: 0, y: 0, w: 76, h: 1 },
  { layer: 'RRC', x: 0, y: 1, w: 76, h: 1 },
  { layer: 'SDAP', x: 76, y: 0, w: 94, h: 2 },
  { layer: 'PDCP', x: 0, y: 2, w: 170, h: 1 },
  { layer: 'RLC', x: 0, y: 3, w: 170, h: 1 },
  { layer: 'MAC', x: 0, y: 4, w: 170, h: 1 },
  { layer: 'PHY', x: 0, y: 5, w: 170, h: 1 },
];
const gnbCells: Cell[] = [
  { layer: 'RRC', x: 0, y: 0, w: 76, h: 2, sub: 'NAS relay' },
  { layer: 'SDAP', x: 76, y: 0, w: 94, h: 2 },
  { layer: 'PDCP', x: 0, y: 2, w: 170, h: 1 },
  { layer: 'RLC', x: 0, y: 3, w: 170, h: 1 },
  { layer: 'MAC', x: 0, y: 4, w: 170, h: 1 },
  { layer: 'PHY', x: 0, y: 5, w: 170, h: 1 },
];

const sameItem = (a: StackItem, side: 'UE' | 'gNB', layer: StackLayer) =>
  a.side === side && (a as { layer: StackLayer }).layer === layer;

const HEADER_DELTA: Partial<Record<StackLayer, number>> = { SDAP: 2, PDCP: 4, RLC: 2, MAC: 4, PHY: 45 };

const StackPanel: React.FC<{ m: MsgState | null }> = ({ m }) => {
  const seq = m?.geom.stack ?? null;
  const color = m ? PHASE_BY_ID[m.step.phase].color : '#94a3b8';
  let idx = -1;
  if (m && seq) {
    if (m.segIndex > m.geom.uuIndex || (m.arrived && m.geom.uuIndex === m.segIndex)) idx = seq.length;
    else if (m.segIndex === m.geom.uuIndex) idx = m.stackIndex;
  }
  const isUP = m?.step.phase === 'up';

  const cellState = (side: 'UE' | 'gNB', layer: StackLayer): 'active' | 'done' | '' => {
    if (!seq || idx < 0) return '';
    const pos = seq.findIndex(it => sameItem(it, side, layer));
    if (pos < 0) return '';
    if (pos === idx) return 'active';
    if (pos < idx) return 'done';
    return '';
  };

  const renderStack = (side: 'UE' | 'gNB', ox: number, cells: Cell[]) => (
    <g>
      {cells.map(c => {
        const st = cellState(side, c.layer);
        const x = ox + c.x, y = STACK_TOP + c.y * ROW_H, w = c.w, h = c.h * ROW_H;
        const delta = HEADER_DELTA[c.layer];
        return (
          <a key={c.layer} href={LAYER_SPECS[c.layer].url} target="_blank" rel="noreferrer" className="node-link">
            <title>{`${side} ${c.layer} — open ${LAYER_SPECS[c.layer].label}`}</title>
            <g className={`cell ${st}`} style={{ '--hl': color } as React.CSSProperties}>
              <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={6} />
              <text x={x + w / 2} y={y + h / 2 + (c.sub ? 0 : 4)} textAnchor="middle" className="cell-label">{c.layer}</text>
              {c.sub && <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" className="cell-sub">{c.sub}</text>}
              {isUP && st === 'active' && delta && (
                <text x={side === 'gNB' ? x + w + 8 : x - 8} y={y + h / 2 + 4}
                  textAnchor={side === 'gNB' ? 'start' : 'end'} className="delta" fill={color}>
                  {side === 'gNB' ? `+${delta} B` : `−${delta} B`}
                </text>
              )}
            </g>
          </a>
        );
      })}
    </g>
  );

  const airItem = seq && idx >= 0 && idx < seq.length && seq[idx].side === 'AIR';
  const airY = STACK_TOP + 5.5 * ROW_H;
  const airFrom = UE_X + STACK_W, airTo = GNB_X;
  const dl = m?.step.msg?.uu?.dir === 'DL';
  const airX = airItem ? (dl ? airTo - (airTo - airFrom) * m!.stackFrac : airFrom + (airTo - airFrom) * m!.stackFrac) : 0;

  return (
    <g>
      <rect x={30} y={356} width={500} height={268} rx={16} className="panel" />
      <text x={48} y={382} className="frame-title">RADIO PROTOCOL STACK · Uu</text>
      {m?.step.msg?.uu && (
        <g>
          <rect x={366} y={368} width={146} height={20} rx={10} fill={color} opacity={0.12} />
          <text x={439} y={382} textAnchor="middle" className="chip-text" fill={color}>
            {m.step.msg.uu.dir === 'DL' ? 'Downlink ↓' : 'Uplink ↑'} · {m.step.msg.uu.top}
          </text>
        </g>
      )}
      {renderStack('UE', UE_X, ueCells)}
      {renderStack('gNB', GNB_X, gnbCells)}

      <Wave x1={airFrom + 6} x2={airTo - 6} y={airY} />
      <text x={(airFrom + airTo) / 2} y={airY - 14} textAnchor="middle" className="link-label"><tspan className="strong">Air</tspan></text>
      {airItem && (
        <g>
          <circle cx={airX} cy={airY} r={11} fill={color} opacity={0.2} />
          <circle cx={airX} cy={airY} r={5.5} fill={color} stroke="white" strokeWidth={2} />
        </g>
      )}

      <text x={UE_X + STACK_W / 2} y={STACK_TOP + 6 * ROW_H + 22} textAnchor="middle" className="stack-title">UE</text>
      <text x={GNB_X + STACK_W / 2} y={STACK_TOP + 6 * ROW_H + 22} textAnchor="middle" className="stack-title">gNB</text>
    </g>
  );
};

// ---------- Encapsulation panel ----------

const EncapPanel: React.FC<{ m: MsgState | null; t: number }> = ({ m, t }) => {
  const st = encapState(m);
  const upStart = STEPS[STEPS.length - 1].start;
  const done = t >= upStart && !st;
  const visible = st?.visible ?? (done ? ['APP'] : []);
  const headers = UP_HEADERS.filter(h => visible.includes(h.id));
  const total = headers.reduce((a, h) => a + h.bytes, 0);

  const X0 = 560, W = 390, BAR_Y = 448, MIN = 36;
  const fixed = headers.length * MIN;
  const k = Math.min(2.2, Math.max(0, W - 30 - fixed) / (total || 1));
  let cx = X0 + 15;
  const color = PHASE_BY_ID.up.color;

  return (
    <g>
      <rect x={X0} y={356} width={W} height={268} rx={16} className="panel" />
      <text x={X0 + 18} y={382} className="frame-title">USER-PLANE ENCAPSULATION</text>

      {headers.length === 0 ? (
        <g>
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={X0 + 15 + i * 74} y={BAR_Y} width={68} height={40} rx={6} className="ghost-bar" />
          ))}
          <text x={X0 + W / 2} y={BAR_Y + 80} textAnchor="middle" className="muted-text">
            Runs in the final step: one byte 'A' travels DN → UE
          </text>
          <text x={X0 + W / 2} y={BAR_Y + 98} textAnchor="middle" className="muted-text">
            and you can watch every header get added and removed.
          </text>
        </g>
      ) : (
        <g>
          <text x={X0 + 18} y={414} className="encap-total">
            {total} <tspan className="encap-unit">{total === 1 ? 'byte' : 'bytes'}</tspan>
            <tspan dx={10} className="encap-unit">≈ {total * 8} bits</tspan>
          </text>
          {headers.map(h => {
            const w = MIN + h.bytes * k;
            const x = cx; cx += w;
            return (
              <g key={h.id}>
                <rect x={x + 1} y={BAR_Y} width={w - 2} height={40} rx={5} fill={h.color} />
                <text x={x + w / 2} y={BAR_Y + 18} textAnchor="middle" className="bar-label">{h.id === 'APP' ? "'A'" : h.id === 'GTPU' ? 'GTP-U' : h.id}</text>
                <text x={x + w / 2} y={BAR_Y + 32} textAnchor="middle" className="bar-bytes">{h.bytes} B</text>
              </g>
            );
          })}
          <text x={X0 + 18} y={BAR_Y + 66} className="stage-text" fill={color}>
            {st?.stage ?? "Delivered · app receives 'A' = 0x41"}
          </text>
          {(st?.delivered || done) && (
            <g>
              <rect x={X0 + 18} y={BAR_Y + 84} width={W - 36} height={64} rx={10} fill={color} opacity={0.08} />
              <text x={X0 + 36} y={BAR_Y + 124} className="delivered-big" fill={color}>'A' = 0x41</text>
              <text x={X0 + W - 36} y={BAR_Y + 112} textAnchor="end" className="muted-text">Total over the air ≈ 94 B</text>
              <text x={X0 + W - 36} y={BAR_Y + 128} textAnchor="end" className="muted-text">Payload: 1 B</text>
            </g>
          )}
          {!st?.delivered && !done && (
            <text x={X0 + 18} y={BAR_Y + 90} className="muted-text">
              Outermost header on the left. PHY adds CRC and coding overhead.
            </text>
          )}
        </g>
      )}
    </g>
  );
};

// ---------- Diagram ----------

const Diagram: React.FC<DiagramProps> = ({ t, stepIndex }) => {
  // Keep the fade-out of the previous message while playing, but not when parked exactly on a step boundary.
  const msgs = activeMessages(t).filter(m => m.step.index >= stepIndex || t - m.step.end > 0.02);
  const current = msgs.find(m => m.step.index === stepIndex) ?? null;

  const vis: Record<string, NodeVisual> = {};
  if (current && current.alpha > 0.2) {
    const path = current.step.msg!.path;
    const color = PHASE_BY_ID[current.step.phase].color;
    path.forEach((id, i) => {
      vis[id] = { role: i === 0 || i === path.length - 1 ? 'endpoint' : 'relay', color };
    });
  }
  const step = STEPS[stepIndex];
  for (const id of step.activate ?? []) {
    if (!vis[id]) vis[id] = { role: 'endpoint', color: PHASE_BY_ID[step.phase].color };
  }

  return (
    <svg viewBox="0 0 1000 640" className="diagram" preserveAspectRatio="xMidYMid meet" role="img"
      aria-label="5G standalone architecture with animated call flow">
      <StaticLinks />
      <g>{msgs.map(m => <MessagePath key={m.step.index} m={m} t={t} />)}</g>
      <g>
        {(Object.keys(NODES) as NodeId[]).map(id => (
          <NodeBox key={id} id={id} t={t} vis={vis[id] ?? { role: null, color: '' }} />
        ))}
      </g>
      <g>{msgs.map(m => <MessageLabel key={m.step.index} m={m} />)}</g>
      <StackPanel m={current && current.geom.stack ? current : null} />
      <EncapPanel m={current} t={t} />
    </svg>
  );
};

export default Diagram;
