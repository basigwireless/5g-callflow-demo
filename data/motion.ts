import {
  STEPS, Step, Pt, Segment, segmentBetween, stackSequence, StackItem, UP_HEADERS,
} from './callflow';

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function polyLength(pts: Pt[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}

/** Returns the part of a polyline from its start up to fraction f, plus the head point. */
function polyPartial(pts: Pt[], f: number): { pts: Pt[]; head: Pt } {
  const total = polyLength(pts);
  let remaining = total * clamp01(f);
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (remaining >= d) { out.push(pts[i]); remaining -= d; continue; }
    const r = d === 0 ? 0 : remaining / d;
    const p: Pt = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r];
    out.push(p);
    return { pts: out, head: p };
  }
  return { pts: out, head: pts[pts.length - 1] };
}

export interface MsgGeometry {
  segments: Segment[];
  weights: number[];
  stack: StackItem[] | null;
  uuIndex: number;          // which segment is the air interface (-1 if none)
  labelAt: Pt;
  labelVertical: boolean;
}

const geomCache = new Map<number, MsgGeometry>();

export function messageGeometry(step: Step): MsgGeometry | null {
  if (!step.msg) return null;
  const cached = geomCache.get(step.index);
  if (cached) return cached;
  const { path, uu, weights: w } = step.msg;
  const segments: Segment[] = [];
  for (let i = 1; i < path.length; i++) segments.push(segmentBetween(path[i - 1], path[i]));
  const uuIndex = segments.findIndex(s => s.kind === 'uu');
  const lengths = segments.map(s => polyLength(s.pts));
  const others = lengths.reduce((a, b, i) => a + (i === uuIndex ? 0 : b), 0);
  // Give the air interface extra time so the protocol-stack animation is readable.
  const weights = w ?? lengths.map((L, i) => (i === uuIndex && uu ? Math.max(others * 1.3, 260) : L));

  // Label: middle of the longest straight run (prefer RAN-row links, which have clear space above).
  let best: { a: Pt; b: Pt; L: number } = { a: segments[0].pts[0], b: segments[0].pts[1], L: -1 };
  const ran = segments.filter(s => s.kind === 'uu' || s.kind === 'n3' || s.kind === 'n6');
  for (const s of ran.length ? ran : segments) for (let i = 1; i < s.pts.length; i++) {
    const L = dist(s.pts[i - 1], s.pts[i]);
    if (L > best.L) best = { a: s.pts[i - 1], b: s.pts[i], L };
  }
  const labelAt: Pt = [(best.a[0] + best.b[0]) / 2, (best.a[1] + best.b[1]) / 2];
  const labelVertical = Math.abs(best.a[0] - best.b[0]) < 1;

  const g: MsgGeometry = {
    segments, weights, uuIndex, labelAt, labelVertical,
    stack: uu ? stackSequence(uu) : null,
  };
  geomCache.set(step.index, g);
  return g;
}

export const TRAVEL_FRACTION = 0.8;
export const FADE_OUT = 0.6;

export interface MsgState {
  step: Step;
  geom: MsgGeometry;
  alpha: number;
  travel: number;            // 0..1 along the full route
  drawn: Pt[][];             // drawn polylines per segment
  head: Pt;
  segIndex: number;
  segFrac: number;
  stackIndex: number;        // index into geom.stack, -1 if not on Uu
  stackFrac: number;         // progress within the current stack item
  arrived: boolean;
}

export function messageState(step: Step, t: number): MsgState | null {
  const geom = messageGeometry(step);
  if (!geom) return null;
  const s0 = step.start + (step.msgDelay ?? 0);
  const s1 = step.end;
  if (t < s0 || t > s1 + FADE_OUT) return null;

  const travelDur = (s1 - s0) * TRAVEL_FRACTION;
  const travel = clamp01((t - s0) / travelDur);
  const alpha = t <= s1 ? clamp01((t - s0) / 0.25) : clamp01(1 - (t - s1) / FADE_OUT);

  const totalW = geom.weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  let segIndex = geom.segments.length - 1;
  let segFrac = 1;
  for (let i = 0; i < geom.segments.length; i++) {
    const w = geom.weights[i] / totalW;
    if (travel <= acc + w || i === geom.segments.length - 1) {
      segIndex = i;
      segFrac = w === 0 ? 1 : clamp01((travel - acc) / w);
      break;
    }
    acc += w;
  }

  const drawn: Pt[][] = [];
  let head: Pt = geom.segments[0].pts[0];
  for (let i = 0; i <= segIndex; i++) {
    const seg = geom.segments[i];
    if (i < segIndex) { drawn.push(seg.pts); head = seg.pts[seg.pts.length - 1]; }
    else { const p = polyPartial(seg.pts, segFrac); drawn.push(p.pts); head = p.head; }
  }

  let stackIndex = -1, stackFrac = 0;
  if (geom.stack && segIndex === geom.uuIndex) {
    const n = geom.stack.length;
    const x = segFrac * n;
    stackIndex = Math.min(n - 1, Math.floor(x));
    stackFrac = x - stackIndex;
  }

  return {
    step, geom, alpha, travel, drawn, head, segIndex, segFrac, stackIndex, stackFrac,
    arrived: travel >= 1,
  };
}

/** All messages visible at time t (current one plus any fading out). */
export function activeMessages(t: number): MsgState[] {
  const out: MsgState[] = [];
  for (const s of STEPS) {
    if (s.end + FADE_OUT < t) continue;
    if (s.start > t) break;
    const m = messageState(s, t);
    if (m) out.push(m);
  }
  return out;
}

// ---------- User-plane encapsulation state ----------
export interface EncapState {
  visible: string[];   // header ids present, outermost first
  stage: string;       // human description
  delivered: boolean;
}

export function encapState(m: MsgState | null): EncapState | null {
  if (!m || m.step.phase !== 'up') return null;
  const ids = UP_HEADERS.map(h => h.id);
  const core = ['IP', 'UDP', 'APP'];
  if (m.arrived) {
    return { visible: ['APP'], stage: "UE strips IP/UDP · app receives 'A' = 0x41", delivered: true };
  }
  if (m.segIndex === 0) return { visible: core, stage: 'DN → UPF over N6 · IP/UDP packet', delivered: false };
  if (m.segIndex === 1) return { visible: ['GTPU', ...core], stage: 'UPF → gNB over N3 · GTP-U tunnel', delivered: false };
  const seq = m.geom.stack!;
  const k = Math.max(0, m.stackIndex);
  const radio = ['SDAP', 'PDCP', 'RLC', 'MAC', 'PHY'];
  const item = seq[k];
  let present: string[];
  if (item.side === 'gNB') present = radio.slice(0, radio.indexOf(item.layer) + 1);
  else if (item.side === 'AIR') present = radio;
  else present = radio.slice(0, radio.indexOf(item.layer));
  const visible = ids.filter(id => present.includes(id) || id === 'GTPU' || core.includes(id));
  const stage =
    item.side === 'gNB' ? `gNB ${item.layer} adds its header`
      : item.side === 'AIR' ? 'Over the air (Uu)'
        : `UE ${item.layer} removes its header`;
  return { visible, stage, delivered: false };
}
