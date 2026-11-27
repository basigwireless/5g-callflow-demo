// Single source of truth for the 5G SA call flow.
// Every visual (diagram, step list, timeline) is derived from this file,
// so adding or re-timing a step only needs a change here.

export type NodeId =
  | 'NRF' | 'AMF' | 'NEF' | 'AUSF' | 'NSSF' | 'UDM' | 'PCF' | 'SMF'
  | 'UPF' | 'gNB' | 'UE' | 'DN';

export type PhaseId = 'core' | 'ng' | 'rrc' | 'reg' | 'sec' | 'pdu' | 'up';

export interface Phase {
  id: PhaseId;
  name: string;
  short: string;
  color: string;
}

export const PHASES: Phase[] = [
  { id: 'core', name: '5G Core bring-up',           short: 'Core',     color: '#0d9488' },
  { id: 'ng',   name: 'NG Setup',                   short: 'NG',       color: '#e11d48' },
  { id: 'rrc',  name: 'Cell access & RRC',          short: 'RRC',      color: '#7c3aed' },
  { id: 'reg',  name: 'Registration & authentication', short: 'Auth',  color: '#2563eb' },
  { id: 'sec',  name: 'NAS security & accept',      short: 'Security', color: '#4f46e5' },
  { id: 'pdu',  name: 'PDU session establishment',  short: 'PDU',      color: '#ea580c' },
  { id: 'up',   name: 'User-plane data',            short: 'Data',     color: '#059669' },
];

export const PHASE_BY_ID = Object.fromEntries(PHASES.map(p => [p.id, p])) as Record<PhaseId, Phase>;

// ---------- Specs ----------
const SPEC = {
  NRF:  { label: 'TS 29.510 (NRF)',  url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129510/18.10.00_60/ts_129510v181000p.pdf' },
  AMF:  { label: 'TS 23.502 (Procedures)', url: 'https://www.etsi.org/deliver/etsi_ts/123500_123599/123502/18.11.00_60/ts_123502v181100p.pdf' },
  NEF:  { label: 'TS 29.520 (NEF)',  url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129520/18.11.00_60/ts_129520v181100p.pdf' },
  AUSF: { label: 'TS 29.509 (AUSF)', url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129509/18.05.00_60/ts_129509v180500p.pdf' },
  NSSF: { label: 'TS 29.531 (NSSF)', url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129531/18.09.00_60/ts_129531v180900p.pdf' },
  UDM:  { label: 'TS 29.503 (UDM)',  url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129503/18.11.00_60/ts_129503v181100p.pdf' },
  PCF:  { label: 'TS 29.512 (PCF)',  url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129512/18.11.00_60/ts_129512v181100p.pdf' },
  SMF:  { label: 'TS 29.502 (SMF)',  url: 'https://www.etsi.org/deliver/etsi_ts/129500_129599/129502/18.10.00_60/ts_129502v181000p.pdf' },
  PFCP: { label: 'TS 29.244 (PFCP)', url: 'https://www.etsi.org/deliver/etsi_ts/129200_129299/129244/18.10.00_60/ts_129244v181000p.pdf' },
  NR:   { label: 'TS 38.300 (NR)',   url: 'https://www.3gpp.org/dynareport/38300.htm' },
  NGAP: { label: 'TS 38.413 (NGAP)', url: 'https://www.3gpp.org/dynareport/38413.htm' },
  RRC:  { label: 'TS 38.331 (RRC)',  url: 'https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/19.00.00_60/ts_138331v190000p.pdf' },
  NAS:  { label: 'TS 24.501 (NAS)',  url: 'https://www.etsi.org/deliver/etsi_ts/124500_124599/124501/18.12.00_60/ts_124501v181200p.pdf' },
  SDAP: { label: 'TS 38.324 (SDAP)', url: 'https://www.etsi.org/deliver/etsi_ts/138300_138399/138324/' },
  PDCP: { label: 'TS 38.323 (PDCP)', url: 'https://www.etsi.org/deliver/etsi_ts/138300_138399/138323/19.00.00_60/ts_138323v190000p.pdf' },
  RLC:  { label: 'TS 38.322 (RLC)',  url: 'https://www.etsi.org/deliver/etsi_ts/138300_138399/138322/19.00.00_60/ts_138322v190000p.pdf' },
  MAC:  { label: 'TS 38.321 (MAC)',  url: 'https://www.etsi.org/deliver/etsi_ts/138300_138399/138321/19.00.00_60/ts_138321v190000p.pdf' },
  PHY:  { label: 'TS 38.291 (PHY)',  url: 'https://www.etsi.org/deliver/etsi_ts/138200_138299/138291/19.01.00_60/ts_138291v190100p.pdf' },
};
export type Spec = { label: string; url: string };
export const LAYER_SPECS = SPEC;

// ---------- Topology ----------
export interface NodeDef {
  id: NodeId;
  label: string;
  sub: string;
  x: number; // centre
  y: number; // centre
  row: 'top' | 'bottom' | 'ran';
  spec?: Spec;
}

export const BUS_Y = 127;
export const NODE_W = 120;
export const NODE_H = 44;

export const NODES: Record<NodeId, NodeDef> = {
  NSSF: { id: 'NSSF', label: 'NSSF', sub: 'Slice selection',   x: 235, y: 74,  row: 'top',    spec: SPEC.NSSF },
  NRF:  { id: 'NRF',  label: 'NRF',  sub: 'Repository',        x: 470, y: 74,  row: 'top',    spec: SPEC.NRF },
  PCF:  { id: 'PCF',  label: 'PCF',  sub: 'Policy control',    x: 700, y: 74,  row: 'top',    spec: SPEC.PCF },
  NEF:  { id: 'NEF',  label: 'NEF',  sub: 'Exposure',          x: 880, y: 74,  row: 'top',    spec: SPEC.NEF },
  AUSF: { id: 'AUSF', label: 'AUSF', sub: 'Authentication',    x: 140, y: 180, row: 'bottom', spec: SPEC.AUSF },
  AMF:  { id: 'AMF',  label: 'AMF',  sub: 'Access & mobility', x: 330, y: 180, row: 'bottom', spec: SPEC.AMF },
  SMF:  { id: 'SMF',  label: 'SMF',  sub: 'Session mgmt',      x: 610, y: 180, row: 'bottom', spec: SPEC.SMF },
  UDM:  { id: 'UDM',  label: 'UDM',  sub: 'Unified data',      x: 860, y: 180, row: 'bottom', spec: SPEC.UDM },
  UE:   { id: 'UE',   label: 'UE',   sub: 'User equipment',    x: 110, y: 300, row: 'ran',    spec: SPEC.NR },
  gNB:  { id: 'gNB',  label: 'gNB',  sub: 'NR base station',   x: 330, y: 300, row: 'ran',    spec: SPEC.NR },
  UPF:  { id: 'UPF',  label: 'UPF',  sub: 'User plane',        x: 610, y: 300, row: 'ran',    spec: SPEC.PFCP },
  DN:   { id: 'DN',   label: 'DN',   sub: 'Data network',      x: 860, y: 300, row: 'ran' },
};

export const CORE_NFS: NodeId[] = ['NSSF', 'NRF', 'PCF', 'NEF', 'AUSF', 'AMF', 'SMF', 'UDM'];
const isCore = (id: NodeId) => CORE_NFS.includes(id);

export type Pt = [number, number];
export type LinkKind = 'sbi' | 'n2' | 'n3' | 'n4' | 'n6' | 'uu';

const half = NODE_W / 2;
const hh = NODE_H / 2;

// Point-to-point reference-point geometry (A -> B direction).
const LINKS: Record<string, { kind: LinkKind; pts: Pt[] }> = {
  'AMF|gNB': { kind: 'n2', pts: [[330, 180 + hh], [330, 300 - hh]] },
  'SMF|UPF': { kind: 'n4', pts: [[610, 180 + hh], [610, 300 - hh]] },
  'gNB|UPF': { kind: 'n3', pts: [[330 + half, 300], [610 - half, 300]] },
  'UPF|DN':  { kind: 'n6', pts: [[610 + half, 300], [860 - 24, 300]] },
  'UE|gNB':  { kind: 'uu', pts: [[110 + half, 300], [330 - half, 300]] },
};

export interface Segment { kind: LinkKind; pts: Pt[] }

export function segmentBetween(a: NodeId, b: NodeId): Segment {
  if (isCore(a) && isCore(b)) {
    const A = NODES[a], B = NODES[b];
    const edge = (n: NodeDef) => (n.row === 'top' ? n.y + hh : n.y - hh);
    return { kind: 'sbi', pts: [[A.x, edge(A)], [A.x, BUS_Y], [B.x, BUS_Y], [B.x, edge(B)]] };
  }
  const fwd = LINKS[`${a}|${b}`];
  if (fwd) return { kind: fwd.kind, pts: fwd.pts };
  const rev = LINKS[`${b}|${a}`];
  if (rev) return { kind: rev.kind, pts: [...rev.pts].reverse() as Pt[] };
  throw new Error(`No link between ${a} and ${b}`);
}

// ---------- Radio protocol stack ----------
export type StackLayer = 'NAS' | 'RRC' | 'SDAP' | 'PDCP' | 'RLC' | 'MAC' | 'PHY';
export type StackItem = { side: 'UE' | 'gNB'; layer: StackLayer } | { side: 'AIR' };

export interface UuTraversal {
  dir: 'DL' | 'UL';
  top: StackLayer; // highest layer involved at the UE
}

const DOWN: StackLayer[] = ['PDCP', 'RLC', 'MAC', 'PHY'];

/** Ordered list of stack cells a message passes through on the air interface. */
export function stackSequence(uu: UuTraversal): StackItem[] {
  const below = (top: StackLayer): StackLayer[] => {
    if (top === 'PHY') return ['PHY'];
    if (top === 'MAC') return ['MAC', 'PHY'];
    if (top === 'SDAP') return ['SDAP', ...DOWN];
    if (top === 'NAS') return ['NAS', 'RRC', ...DOWN];
    return ['RRC', ...DOWN];
  };
  const ueDown = below(uu.top);
  // NAS terminates in the AMF; at the gNB it rides inside RRC.
  const gnbDown = below(uu.top === 'NAS' ? 'RRC' : uu.top);
  const ue = ueDown.map(layer => ({ side: 'UE' as const, layer }));
  const gnb = gnbDown.map(layer => ({ side: 'gNB' as const, layer }));
  return uu.dir === 'DL'
    ? [...gnb, { side: 'AIR' }, ...[...ue].reverse()]
    : [...ue, { side: 'AIR' }, ...[...gnb].reverse()];
}

// ---------- Steps ----------
export interface MessageDef {
  path: NodeId[];
  label: string;   // short label drawn on the diagram
  name: string;    // full 3GPP message / service name
  iface: string;   // e.g. "N2 · NGAP"
  uu?: UuTraversal;
  weights?: number[]; // optional time weight per segment
}

export interface StepDef {
  phase: PhaseId;
  title: string;
  desc: string;
  dur: number;
  activate?: NodeId[];
  msg?: MessageDef;
  msgDelay?: number;
  spec?: Spec;
}

const nfBoot = (nf: NodeId, what: string): StepDef => ({
  phase: 'core',
  title: `${nf} starts and registers with NRF`,
  desc: `The ${what} comes up and publishes its NF profile to the NRF so other network functions can discover it.`,
  dur: 4,
  activate: [nf],
  msgDelay: 1,
  msg: { path: [nf, 'NRF'], label: 'NFRegister', name: 'Nnrf_NFManagement_NFRegister', iface: 'SBI · Nnrf' },
  spec: SPEC.NRF,
});

const RAW_STEPS: StepDef[] = [
  // ---- Core bring-up
  { phase: 'core', title: 'NRF starts', dur: 3, activate: ['NRF'], spec: SPEC.NRF,
    desc: 'The NF Repository Function comes up first. Every other core function registers with it and discovers its peers through it.' },
  nfBoot('AMF', 'Access and Mobility Management Function'),
  nfBoot('NEF', 'Network Exposure Function'),
  nfBoot('AUSF', 'Authentication Server Function'),
  nfBoot('NSSF', 'Network Slice Selection Function'),
  nfBoot('UDM', 'Unified Data Management function'),
  nfBoot('PCF', 'Policy Control Function'),
  nfBoot('SMF', 'Session Management Function'),
  { phase: 'core', title: 'UPF starts', dur: 3, activate: ['UPF'], spec: SPEC.PFCP,
    desc: 'The User Plane Function comes up, ready to forward user traffic between the RAN (N3) and the data network (N6).' },
  { phase: 'core', title: 'gNB powers on', dur: 3, activate: ['gNB'], spec: SPEC.NR,
    desc: 'The NR base station starts. Before serving any UE it must set up its N2 association with the AMF.' },

  // ---- NG Setup
  { phase: 'ng', title: 'gNB sends NG Setup Request', dur: 5, spec: SPEC.NGAP,
    desc: 'The gNB introduces itself to the AMF over N2: its global ID, supported tracking areas and PLMN / slice support.',
    msg: { path: ['gNB', 'AMF'], label: 'NG Setup Request', name: 'NGAP NG Setup Request', iface: 'N2 · NGAP' } },
  { phase: 'ng', title: 'AMF sends NG Setup Response', dur: 5, spec: SPEC.NGAP,
    desc: 'The AMF accepts the gNB and returns its name, served GUAMI list and relative capacity. The N2 interface is now up.',
    msg: { path: ['AMF', 'gNB'], label: 'NG Setup Response', name: 'NGAP NG Setup Response', iface: 'N2 · NGAP' } },

  // ---- RRC
  { phase: 'rrc', title: 'UE powers on', dur: 3, activate: ['UE'], spec: SPEC.NR,
    desc: 'The UE switches on and begins searching for a suitable NR cell.' },
  { phase: 'rrc', title: 'Cell search & synchronization', dur: 5, spec: { label: 'TS 38.213 (PHY control)', url: 'https://www.3gpp.org/dynareport/38213.htm' },
    desc: 'The UE detects the SSB (PSS/SSS + PBCH), synchronizes in time and frequency and reads the MIB / SIB1 to learn how to access the cell.',
    msg: { path: ['gNB', 'UE'], label: 'SSB / MIB', name: 'SS/PBCH Block + System Information', iface: 'Uu · PHY', uu: { dir: 'DL', top: 'PHY' } } },
  { phase: 'rrc', title: 'Random access (RACH)', dur: 5, spec: SPEC.MAC,
    desc: 'The UE sends a random-access preamble (Msg1); the gNB answers with a Random Access Response carrying timing advance and an uplink grant.',
    msg: { path: ['UE', 'gNB'], label: 'RACH Preamble', name: 'Random Access Preamble (Msg1)', iface: 'Uu · MAC', uu: { dir: 'UL', top: 'MAC' } } },
  { phase: 'rrc', title: 'UE sends RRC Setup Request', dur: 5, spec: SPEC.RRC,
    desc: 'Using the granted resources, the UE asks for an RRC connection, with its initial identity and establishment cause (Msg3).',
    msg: { path: ['UE', 'gNB'], label: 'RRC Setup Request', name: 'RRCSetupRequest', iface: 'Uu · RRC', uu: { dir: 'UL', top: 'RRC' } } },
  { phase: 'rrc', title: 'gNB sends RRC Setup', dur: 5, spec: SPEC.RRC,
    desc: 'The gNB configures SRB1 and the cell group (radio bearer and MAC/PHY parameters) for the UE.',
    msg: { path: ['gNB', 'UE'], label: 'RRC Setup', name: 'RRCSetup', iface: 'Uu · RRC', uu: { dir: 'DL', top: 'RRC' } } },
  { phase: 'rrc', title: 'UE completes RRC Setup', dur: 5, spec: SPEC.RRC,
    desc: 'The UE confirms the configuration. RRC Setup Complete also carries the first NAS message piggy-backed for the AMF.',
    msg: { path: ['UE', 'gNB'], label: 'RRC Setup Complete', name: 'RRCSetupComplete', iface: 'Uu · RRC', uu: { dir: 'UL', top: 'RRC' } } },

  // ---- Registration & authentication
  { phase: 'reg', title: 'UE sends Registration Request', dur: 5, spec: SPEC.NAS,
    desc: 'The NAS Registration Request (with SUCI and requested NSSAI) is relayed by the gNB to the AMF inside an NGAP Initial UE Message.',
    msg: { path: ['UE', 'gNB', 'AMF'], label: 'Registration Request', name: 'NAS Registration Request', iface: 'N1 · NAS (via N2)', uu: { dir: 'UL', top: 'NAS' } } },
  { phase: 'reg', title: 'AMF requests slice selection', dur: 4, spec: SPEC.NSSF,
    desc: 'The AMF asks the NSSF which network slices the UE is allowed to use.',
    msg: { path: ['AMF', 'NSSF'], label: 'NSSelection Get', name: 'Nnssf_NSSelection_Get', iface: 'SBI · Nnssf' } },
  { phase: 'reg', title: 'NSSF returns Allowed NSSAI', dur: 4, spec: SPEC.NSSF,
    desc: 'The NSSF answers with the Allowed NSSAI and slice information for this UE.',
    msg: { path: ['NSSF', 'AMF'], label: 'Allowed NSSAI', name: 'Nnssf_NSSelection_Get Response', iface: 'SBI · Nnssf' } },
  { phase: 'reg', title: 'AMF starts authentication with AUSF', dur: 5, spec: SPEC.AUSF,
    desc: 'The AMF (SEAF) asks the AUSF to authenticate the subscriber identified by its SUCI.',
    msg: { path: ['AMF', 'AUSF'], label: 'UEAuthentication', name: 'Nausf_UEAuthentication_Authenticate Request', iface: 'SBI · Nausf' } },
  { phase: 'reg', title: 'AUSF requests auth vector from UDM', dur: 5, spec: SPEC.UDM,
    desc: 'The AUSF asks the UDM to de-conceal the SUCI and generate an authentication vector.',
    msg: { path: ['AUSF', 'UDM'], label: 'Get Auth Vector', name: 'Nudm_UEAuthentication_Get Request', iface: 'SBI · Nudm' } },
  { phase: 'reg', title: 'UDM returns the auth vector', dur: 5, spec: SPEC.UDM,
    desc: 'The UDM returns the 5G home-environment authentication vector (RAND, AUTN, XRES*, KAUSF) and the SUPI.',
    msg: { path: ['UDM', 'AUSF'], label: '5G HE AV', name: 'Nudm_UEAuthentication_Get Response', iface: 'SBI · Nudm' } },
  { phase: 'reg', title: 'AUSF sends challenge to AMF', dur: 5, spec: SPEC.AUSF,
    desc: 'The AUSF stores XRES* and forwards the serving-environment vector (RAND, AUTN, HXRES*) to the AMF.',
    msg: { path: ['AUSF', 'AMF'], label: '5G SE AV', name: 'Nausf_UEAuthentication_Authenticate Response', iface: 'SBI · Nausf' } },
  { phase: 'reg', title: 'AMF sends Authentication Request', dur: 5, spec: SPEC.NAS,
    desc: 'The AMF challenges the UE with RAND and AUTN. The UE verifies the network and computes RES*.',
    msg: { path: ['AMF', 'gNB', 'UE'], label: 'Authentication Request', name: 'NAS Authentication Request', iface: 'N1 · NAS', uu: { dir: 'DL', top: 'NAS' } } },
  { phase: 'reg', title: 'UE sends Authentication Response', dur: 5, spec: SPEC.NAS,
    desc: 'The UE returns RES*. The AMF checks it against HXRES* and forwards it to the AUSF for final confirmation.',
    msg: { path: ['UE', 'gNB', 'AMF', 'AUSF'], label: 'Authentication Response', name: 'NAS Authentication Response (RES*)', iface: 'N1 · NAS → Nausf', uu: { dir: 'UL', top: 'NAS' } } },
  { phase: 'reg', title: 'AUSF confirms authentication', dur: 5, spec: SPEC.AUSF,
    desc: 'RES* matches XRES*: authentication succeeded. The AUSF sends the result and the anchor key (KSEAF) to the AMF.',
    msg: { path: ['AUSF', 'AMF'], label: 'Auth Success', name: 'Nausf_UEAuthentication_Authenticate Response (success)', iface: 'SBI · Nausf' } },

  // ---- Security
  { phase: 'sec', title: 'AMF sends Security Mode Command', dur: 5, spec: SPEC.NAS,
    desc: 'The AMF selects NAS ciphering and integrity algorithms and activates NAS security with the UE.',
    msg: { path: ['AMF', 'gNB', 'UE'], label: 'Security Mode Command', name: 'NAS Security Mode Command', iface: 'N1 · NAS', uu: { dir: 'DL', top: 'NAS' } } },
  { phase: 'sec', title: 'UE completes Security Mode', dur: 5, spec: SPEC.NAS,
    desc: 'The UE derives the NAS keys and replies, now integrity-protected and ciphered.',
    msg: { path: ['UE', 'gNB', 'AMF'], label: 'Security Mode Complete', name: 'NAS Security Mode Complete', iface: 'N1 · NAS', uu: { dir: 'UL', top: 'NAS' } } },
  { phase: 'sec', title: 'AMF sends Registration Accept', dur: 5, spec: SPEC.NAS,
    desc: 'The UE is registered. The AMF assigns a 5G-GUTI, the registration area and the Allowed NSSAI.',
    msg: { path: ['AMF', 'gNB', 'UE'], label: 'Registration Accept', name: 'NAS Registration Accept', iface: 'N1 · NAS', uu: { dir: 'DL', top: 'NAS' } } },

  // ---- PDU session
  { phase: 'pdu', title: 'UE requests a PDU session', dur: 5, spec: SPEC.NAS,
    desc: 'The UE asks for a data session (DNN, S-NSSAI, PDU session type) in a NAS SM message carried via the AMF.',
    msg: { path: ['UE', 'gNB', 'AMF'], label: 'PDU Session Est. Request', name: 'NAS PDU Session Establishment Request', iface: 'N1 · NAS-SM', uu: { dir: 'UL', top: 'NAS' } } },
  { phase: 'pdu', title: 'AMF creates SM context at SMF', dur: 5, spec: SPEC.SMF,
    desc: 'The AMF selects an SMF and forwards the session request to it.',
    msg: { path: ['AMF', 'SMF'], label: 'CreateSMContext', name: 'Nsmf_PDUSession_CreateSMContext Request', iface: 'SBI · Nsmf' } },
  { phase: 'pdu', title: 'SMF requests policy from PCF', dur: 5, spec: SPEC.PCF,
    desc: 'The SMF opens an SM policy association to fetch the policy and charging rules for the session.',
    msg: { path: ['SMF', 'PCF'], label: 'SMPolicyControl Create', name: 'Npcf_SMPolicyControl_Create Request', iface: 'SBI · Npcf' } },
  { phase: 'pdu', title: 'PCF returns policy decision', dur: 5, spec: SPEC.PCF,
    desc: 'The PCF answers with PCC rules: QoS flows, session AMBR and charging information.',
    msg: { path: ['PCF', 'SMF'], label: 'Policy Decision', name: 'Npcf_SMPolicyControl_Create Response', iface: 'SBI · Npcf' } },
  { phase: 'pdu', title: 'SMF sets up the session on UPF', dur: 5, spec: SPEC.PFCP,
    desc: 'Over N4, the SMF installs packet detection, forwarding and QoS rules (PDR / FAR / QER) on the UPF.',
    msg: { path: ['SMF', 'UPF'], label: 'PFCP Session Est. Request', name: 'PFCP Session Establishment Request', iface: 'N4 · PFCP' } },
  { phase: 'pdu', title: 'UPF confirms the session', dur: 5, spec: SPEC.PFCP,
    desc: 'The UPF acknowledges and returns the N3 tunnel endpoint (F-TEID) for the uplink GTP-U tunnel.',
    msg: { path: ['UPF', 'SMF'], label: 'PFCP Session Est. Response', name: 'PFCP Session Establishment Response', iface: 'N4 · PFCP' } },
  { phase: 'pdu', title: 'SMF sends PDU Session Accept to AMF', dur: 5, spec: SPEC.AMF,
    desc: 'The SMF hands the AMF the NAS Accept for the UE and the N2 resource setup information for the gNB.',
    msg: { path: ['SMF', 'AMF'], label: 'N1N2MessageTransfer', name: 'Namf_Communication_N1N2MessageTransfer', iface: 'SBI · Namf' } },
  { phase: 'pdu', title: 'AMF delivers PDU Session Accept to UE', dur: 5, spec: SPEC.NAS,
    desc: 'The gNB sets up the radio resources for the session and passes the NAS PDU Session Establishment Accept (with the UE IP address) to the UE.',
    msg: { path: ['AMF', 'gNB', 'UE'], label: 'PDU Session Est. Accept', name: 'NAS PDU Session Establishment Accept', iface: 'N1 · NAS-SM', uu: { dir: 'DL', top: 'NAS' } } },

  // ---- User plane
  { phase: 'up', title: 'Downlink data reaches the UE', dur: 18, spec: SPEC.SDAP,
    desc: "A single application byte 'A' (0x41) travels from the data network to the UE. Watch each layer add its header on the way down the gNB stack and remove it on the way up the UE stack.",
    msg: { path: ['DN', 'UPF', 'gNB', 'UE'], label: "Data: 'A'", name: 'Downlink user-plane packet', iface: 'N6 → N3 (GTP-U) → Uu', uu: { dir: 'DL', top: 'SDAP' }, weights: [2, 2, 11] } },
];

export interface Step extends StepDef {
  index: number;
  start: number;
  end: number;
}

export const STEPS: Step[] = (() => {
  let t = 0;
  return RAW_STEPS.map((s, index) => {
    const step = { ...s, index, start: t, end: t + s.dur };
    t += s.dur;
    return step;
  });
})();

export const TOTAL_DURATION = STEPS[STEPS.length - 1].end;

/** Time at which each node becomes active. */
export const NODE_START: Record<NodeId, number> = (() => {
  const m = {} as Record<NodeId, number>;
  for (const s of STEPS) for (const n of s.activate ?? []) m[n] = s.start;
  m.DN = 0;
  return m;
})();

export function stepIndexAt(t: number): number {
  let lo = 0;
  for (let i = 0; i < STEPS.length; i++) if (STEPS[i].start <= t + 1e-6) lo = i;
  return lo;
}

// ---------- User-plane encapsulation (bytes, outermost first) ----------
export interface Header { id: string; label: string; bytes: number; color: string }

export const UP_HEADERS: Header[] = [
  { id: 'PHY',  label: 'PHY · CRC/coding', bytes: 45, color: '#64748b' },
  { id: 'MAC',  label: 'MAC',   bytes: 4,  color: '#7c3aed' },
  { id: 'RLC',  label: 'RLC',   bytes: 2,  color: '#2563eb' },
  { id: 'PDCP', label: 'PDCP',  bytes: 4,  color: '#0891b2' },
  { id: 'SDAP', label: 'SDAP',  bytes: 2,  color: '#0d9488' },
  { id: 'GTPU', label: 'GTP-U', bytes: 8,  color: '#ea580c' },
  { id: 'IP',   label: 'IP',    bytes: 20, color: '#e11d48' },
  { id: 'UDP',  label: 'UDP',   bytes: 8,  color: '#db2777' },
  { id: 'APP',  label: "'A'",   bytes: 1,  color: '#059669' },
];
