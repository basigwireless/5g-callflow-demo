# 5G SA Call Flow Visualizer

Interactive, step-by-step animation of a 5G standalone (SA) call flow, from BaSig Wireless Laboratories.

It walks through 40 steps in seven phases:

1. **5G Core bring-up**: NFs start and register with the NRF
2. **NG Setup**: gNB ↔ AMF over N2
3. **Cell access & RRC**: SSB, RACH, RRC Setup
4. **Registration & authentication**: NSSF slice selection, AUSF/UDM 5G-AKA
5. **NAS security & accept**
6. **PDU session establishment**: SMF, PCF, UPF (N4/PFCP)
7. **User-plane data**: one byte `'A'` travels DN → UE, showing every header added and removed

## Controls

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `←` / `→` | Previous / next step |
| `R` | Restart |
| `+` / `-` | Faster / slower |
| `F` | Full screen |

Click a step in the sidebar or anywhere on the timeline to jump. Click a network function or protocol layer to open its 3GPP/ETSI spec.

Deep links: `#step-19` opens the demo at step 19; `#step-19-paused` opens it paused there.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build -- --base ./
```

## Editing the call flow

Everything is driven by `data/callflow.ts`: phases, node positions, and the ordered list of steps (title, description, duration, message path, interface, spec link). The diagram, step list and timeline are all derived from it, so adding or re-timing a step only needs a change there.
