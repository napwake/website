// Scenes: the corridor at night. Every door is an arch (round top, flat bottom), the same arch as
// the wordmark's counters. Asleep: closed and dark. Waking: ajar, an amber wedge, the doorman's hand
// on it. Awake: fully open, the room lit green, a green lamp over the door.
import { figure, POSES, PAL, DARK, G, handFilter } from './doorman.mjs';

export const THEME = {
  light: { wall: '#EEEEEA', floor: '#DEDED7', frame: '#D3D3CB', leaf: '#5B6B86', leafEdge: '#4A5872', knob: '#C98A1A', amberRoom: '#FFE3A1', amber: '#F5B53F', greenRoom: '#DDF3E3', green: '#2E9F62', greenGlow: '#7FD3A0', label: '#5E6764', guest: '#0F1716', st: { asleep: '#56657F', waking: '#9A6400', awake: '#1F7A47', error: '#C0392B' }, col: PAL, note: '#F8F8F5' },
  dark: { wall: '#0F1716', floor: '#0A1110', frame: '#1B2A2C', leaf: '#2A3944', leafEdge: '#22303A', knob: '#F5B53F', amberRoom: '#FFE3A1', amber: '#F5B53F', greenRoom: '#C9EED6', green: '#4CC284', greenGlow: '#4CC284', label: '#8C9895', guest: '#0F1716', st: { asleep: '#93A3BE', waking: '#F5B53F', awake: '#4CC284', error: '#F2685E' }, col: DARK, note: '#F8F8F5' },
};
const f = (n) => Math.round(n * 100) / 100;
const arch = (x, y, w, h) => `M${f(x)} ${f(y + h)} V${f(y + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w / 2)} V${f(y + h)} Z`;
const MONO = "'Atkinson Hyperlegible Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

// one door at (x, floorY), width w, height h
export function door(state, x, fy, w, h, T, { label, stateLabel = true, sc = 1 } = {}) {
  const y = fy - h, fw = 7 * sc;
  let s = `<path d="${arch(x - fw, y - fw, w + 2 * fw, h + fw)}" fill="${T.frame}"/>`;
  const leafW = w;
  if (state === 'asleep' || state === 'error') {
    s += `<path d="${arch(x, y, w, h)}" fill="${T.leaf}"/>`;
    s += `<path d="M${f(x + w * 0.5)} ${f(y + w * 0.5)} V${fy}" stroke="${T.leafEdge}" stroke-width="${f(2 * sc)}"/>`;
    s += `<circle cx="${f(x + w * 0.82)}" cy="${f(fy - h * 0.44)}" r="${f(3.6 * sc)}" fill="${T.knob}"/>`;
    if (state === 'error') s += `<g transform="rotate(5 ${f(x + w / 2)} ${f(y + h * 0.42)})"><rect x="${f(x + w * 0.24)}" y="${f(y + h * 0.3)}" width="${f(w * 0.52)}" height="${f(w * 0.62)}" rx="2" fill="${T.note}"/><rect x="${f(x + w * 0.47)}" y="${f(y + h * 0.34)}" width="${f(w * 0.07)}" height="${f(w * 0.28)}" rx="2" fill="#D9443A"/><circle cx="${f(x + w / 2)}" cy="${f(y + h * 0.34 + w * 0.39)}" r="${f(w * 0.04)}" fill="#D9443A"/><circle cx="${f(x + w / 2)}" cy="${f(y + h * 0.3)}" r="${f(w * 0.05)}" fill="#D9443A"/></g>`;
  } else if (state === 'waking') {
    s += `<path d="${arch(x, y, w, h)}" fill="${T.amberRoom}"/>`;
    // amber wedge spilling from the gap onto the floor
    s += `<path d="M${f(x + w * 0.5)} ${fy} H${f(x + w)} L${f(x + w + 130 * sc)} ${f(fy + 60 * sc)} H${f(x + w * 0.5 + 30 * sc)} Z" fill="${T.amber}" opacity=".55"/>`;
    // the leaf, swung in partway from the hinge on the left; its free edge at 50%
    s += `<path d="M${x} ${fy} V${f(y + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w * 0.3)} ${f(y + 3 * sc)} L${f(x + w * 0.5)} ${f(y + 12 * sc)} V${f(fy - 3 * sc)} Z" fill="${T.leaf}"/>`;
    s += `<circle cx="${f(x + w * 0.42)}" cy="${f(fy - h * 0.44)}" r="${f(3.4 * sc)}" fill="${T.knob}"/>`;
  } else if (state === 'awake') {
    s += `<path d="${arch(x, y, w, h)}" fill="${T.greenRoom}"/>`;
    s += `<path d="M${x} ${fy} H${f(x + w)} L${f(x + w + 80 * sc)} ${f(fy + 60 * sc)} H${f(x - 80 * sc)} Z" fill="${T.greenGlow}" opacity=".32"/>`;
    // the leaf, swung fully open against the wall on the hinge side
    s += `<path d="M${f(x - fw)} ${fy} V${f(y + w * 0.3)} L${f(x - fw - 14 * sc)} ${f(y + w * 0.42)} V${f(fy + 6 * sc)} Z" fill="${T.leaf}"/>`;
    // the green lamp over the door
    s += `<circle cx="${f(x + w / 2)}" cy="${f(y - fw - 9 * sc)}" r="${f(13 * sc)}" fill="${T.greenGlow}" opacity=".28"/><rect x="${f(x + w / 2 - 7 * sc)}" y="${f(y - fw - 13 * sc)}" width="${f(14 * sc)}" height="${f(8 * sc)}" rx="${f(4 * sc)}" fill="${T.green}"/>`;
  }
  return s;
}

export function labelsFor(state, x, fy, w, h, T, label, sc, stateLabel = true) {
  const y = fy - h, word = { asleep: 'asleep', waking: 'waking up', awake: 'awake', error: 'needs you' }[state];
  let s = '';
  if (label) s += `<text x="${f(x + w / 2)}" y="${f(y - (state === 'awake' ? 32 : 18) * sc)}" text-anchor="middle" font-family="${MONO}" font-size="${f(12.5 * sc)}" fill="${T.label}">${label}</text>`;
  if (stateLabel) s += `<text x="${f(x + w / 2)}" y="${f(fy + 22 * sc)}" text-anchor="middle" font-family="${MONO}" font-size="${f(12 * sc)}" fill="${T.st[state]}" font-weight="700" letter-spacing=".3">${word}</text>`;
  return s;
}

// The hand of the 'door' pose, in figure coordinates (feet at 0,0): the mitten that grips the leaf
export function doorHand() {
  const p = POSES.door, t = p.turn || 0, at = Math.abs(t), a = p.lean * Math.PI / 180;
  const lx = G.shW / 2 - 4 - (t > 0 ? 10 * at : 2 * at), ly = -103 - (p.shrug || 0);
  const sx = lx * Math.cos(a) - ly * Math.sin(a), sy = lx * Math.sin(a) + ly * Math.cos(a);
  return p.arms.R.h([sx, sy]);
}

// The corridor. rooms: [{state,label}], doormanAt: index of the waking door the doorman holds.
export function corridor({ w = 1280, h = 400, rooms, theme = 'dark', x0 = 40, floorY = null, sc = 1, doormanAt = -1, labels = true, stateLabels = true, wall = true, hand = true, pose = 'door' } = {}) {
  const T = THEME[theme];
  const dw = 78 * sc, dh = 156 * sc, gap = 30 * sc, pgap = 112 * sc, fy = floorY ?? h - 46 * sc;
  let x = x0, art = '', txt = '';
  let bg = '';
  if (wall) bg += `<rect width="${w}" height="${h}" fill="${T.wall}"/><rect y="${fy}" width="${w}" height="${h - fy}" fill="${T.floor}"/>`;
  const fid = 'hf' + Math.random().toString(36).slice(2, 7);
  let figs = '';
  rooms.forEach((rm, i) => {
    if (i === doormanAt) x += pgap - gap;
    art += door(rm.state, x, fy, dw, dh, T, { sc });
    if (labels || stateLabels) txt += labelsFor(rm.state, x, fy, dw, dh, T, labels ? rm.label : null, sc, stateLabels);
    if (i === doormanAt) {
      // place the doorman so his mitten sits on the leaf's free edge
      const [hx, hy] = doorHand(), k = sc * 0.86;
      const ex = x + dw * 0.5;
      const tx = ex - hx * k, ty = fy;
      // cast shadow away from the light
      figs += `<path d="M${f(tx - 30 * k)} ${f(fy)} H${f(tx + 34 * k)} L${f(tx - 90 * k)} ${f(fy + 30 * k)} H${f(tx - 170 * k)} Z" fill="#000" opacity="${theme === 'dark' ? .3 : .09}"/>`;
      figs += `<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(k)})">${figure({ ...POSES[pose], ground: false }, T.col)}</g>`;
    }
    x += dw + gap;
  });
  const gid = fid + 'g';
  const wallGrain = wall && hand ? `<filter id="${gid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${theme === 'dark' ? .22 : .07} 0"/></filter><rect width="${w}" height="${h}" filter="url(#${gid})"/>` : '';
  return bg + (hand ? `<defs>${handFilter(fid, 1.4, 0.13)}</defs>${wallGrain}<g filter="url(#${fid})">${art}${figs}</g>` : art + figs) + txt;
}

// ---------- state glyphs: the same arch doors, on a 24 grid ----------
export const GLYPH = {
  fill: { asleep: '#5B6B86', waking: '#F5B53F', awake: '#2E9F62', error: '#D9443A' },
};
export function glyph(state, theme = 'light') {
  const A = 'M6 22V10A6 6 0 0 1 18 10V22Z';
  const lite = theme === 'dark' ? { slate: '#8C9BB5', amber: '#F5B53F', green: '#4CC284', red: '#F0645A', room: '#FFE3A1', groom: '#C9EED6', leaf: '#2A3944', label: '#8C9895' } : { slate: '#5B6B86', amber: '#F5B53F', green: '#2E9F62', red: '#D9443A', room: '#FFE3A1', groom: '#DDF3E3', leaf: '#4A5872', label: '#5E6764' };
  // not a state: the empty doorway of a workload the scan couldn't judge, or one Napwake is still setting up
  if (state === 'other') return `<path d="M6.8 22V10A5.2 5.2 0 0 1 17.2 10V22" fill="none" stroke="${lite.label}" stroke-width="1.6" stroke-dasharray="2.2 1.8"/>`;
  if (state === 'asleep') return `<path d="${A}" fill="${lite.slate}"/><circle cx="15.3" cy="15" r="1.2" fill="#F8F8F5"/>`;
  if (state === 'waking') return `<path d="${A}" fill="${lite.room}" stroke="${lite.amber}" stroke-width="1.6"/><path d="M6 22V10A6 6 0 0 1 9.5 4.6L12 6V22Z" fill="${lite.leaf}"/><path d="M12 22.2H18L23 23.6H13Z" fill="${lite.amber}"/>`;
  if (state === 'awake') return `<path d="${A}" fill="${lite.groom}" stroke="${lite.green}" stroke-width="1.6"/><rect x="10" y="0.6" width="4" height="2.2" rx="1.1" fill="${lite.green}"/><path d="M6.5 22.2H17.5L21 23.6H3Z" fill="${lite.green}" opacity=".6"/>`;
  return `<path d="${A}" fill="${lite.slate}"/><rect x="8.2" y="9.5" width="7.6" height="8.6" rx="1" fill="#F8F8F5" transform="rotate(6 12 13.8)"/><rect x="11.3" y="10.8" width="1.5" height="3.6" rx=".75" fill="${lite.red}"/><circle cx="12.1" cy="16.2" r=".9" fill="${lite.red}"/>`;
}

// ---------- the building: the cluster as a hotel at night ("Lights left on", 2026-10-23) ----------
// Always the same building: five floors of seven rooms over a lobby, a domed roofline, the street. Every room
// is door() at scale 1. Up to 35 workloads, one room each, filled from the ground floor up, the rooms left over
// shuttered; past 35, the cluster's mix rounded to its 35 rooms. Drawn dark: lit rooms only read at night.
export const BUILDING = (() => {
  const COLS = 7, ROWS = 5, M = 56, T = 26, P = 40, PITCH = 118, DOOR_W = 78, DOOR_H = 156;
  const HEAD = 40, FLOOR = 28, SLAB = 18, STOREY = HEAD + DOOR_H + FLOOR + SLAB;
  const TOP = 150, CORNICE = 22, GABLE = 132, LOBBY = 236, STREET = 44, STREET_SC = 1.25;
  const BW = 2 * T + 2 * P + COLS * DOOR_W + (COLS - 1) * (PITCH - DOOR_W);
  const Y0 = TOP + CORNICE, LOBBY_Y = Y0 + ROWS * STOREY, GROUND = LOBBY_Y + LOBBY;
  return { COLS, ROWS, ROOMS: COLS * ROWS, M, T, P, PITCH, DOOR_W, DOOR_H, HEAD, FLOOR, SLAB, STOREY, TOP, CORNICE, GABLE, LOBBY, STREET, STREET_SC, BW, W: BW + 2 * M, Y0, LOBBY_Y, GROUND, H: GROUND + STREET };
})();

// One room at the origin (the door at 0..78, its floor at y 156), in door()'s own parts. Kinds:
//   asleep; idle, lit for nobody (awake and empty); active, in use (awake, a guest in the light); waking;
//   pausing, going to sleep (ajar, the room already dark, no wedge, no hand); error;
//   other, not judged or setting up (an empty doorway, its arch dashed: no state);
//   shut, a room the cluster doesn't fill (a shuttered window in the wall: no state at all).
// idle and active are drawn in layers so a page can turn them off, light first: r-lamp, then r-lit (the room's
// light over r-dark), then r-shut (the closed leaf, folded to its hinge) swings over r-open. off: drawn already off.
export function room(kind, T = THEME.dark, { off = false } = {}) {
  const W = BUILDING.DOOR_W, H = BUILDING.DOOR_H, FY = H;
  const parts = (state) => door(state, 0, FY, W, H, T, { sc: 1 }).match(/<g[\s\S]*?<\/g>|<(path|circle|rect)\b[^>]*\/>/g);
  const A = parts('asleep'), K = parts('awake'), Wk = parts('waking'), E = parts('error');
  const frame = A[0], dark = `<path class="r-dark" d="${arch(0, FY - H, W, H)}" fill="${T.floor}"/>`;
  const hide = off ? ' style="opacity:0"' : '';
  const lamp = `<g class="r-lamp"${hide}>${K[4]}${K[5]}</g>`, open = `<g class="r-open"${hide}>${K[3]}</g>`;
  const shut = `<g class="r-shut" style="opacity:${off ? 1 : 0}" transform="scale(${off ? 1 : 0.06} 1)">${A[1]}${A[2]}${A[3]}</g>`;
  // the guest: an arch for the body and a circle for the head, standing back in the room, so smaller than the door
  const guest = `<g class="r-guest"><path d="${arch(43, 101, 24, 51)}" fill="${T.guest}"/><circle cx="55" cy="88" r="9.5" fill="${T.guest}"/></g>`;
  switch (kind) {
    case 'asleep': return frame + A.slice(1).join('');
    case 'idle': return frame + dark + `<g class="r-lit"${hide}>${K[1]}${K[2]}</g>` + open + lamp + shut;
    case 'active': return frame + dark + `<g class="r-lit">${K[1]}${guest}${K[2]}</g>` + open.replace(hide, '') + lamp.replace(hide, '');
    case 'waking': return frame + Wk.slice(1).join('');
    case 'pausing': return frame + dark + Wk[3] + Wk[4];
    case 'error': return frame + E.slice(1).join('');
    case 'other': return frame + `<path d="${arch(0, FY - H, W, H)}" fill="${T.wall}"/><path d="${arch(4, FY - H + 4, W - 8, H - 4)}" fill="none" stroke="${T.label}" stroke-width="3" stroke-dasharray="7 6"/>`;
    default: // shut: square on purpose, since doors are arches; the surround, sill and louvres in the frame colour
      return `<rect x="8" y="98" width="62" height="5" fill="${T.frame}"/><rect x="12" y="30" width="54" height="68" fill="${T.frame}"/>` +
        [16, 40].map((px) => `<rect x="${px}" y="34" width="22" height="60" fill="${T.wall}"/>` +
          [41, 49, 57, 65, 73, 81].map((ly) => `<path d="M${px + 3} ${ly} H${px + 19}" stroke="${T.frame}" stroke-width="2"/>`).join('')).join('');
  }
}

// Which room shows what. kinds: [{ k, n, event, stays }] in the order they're placed: k a room kind, n its
// workloads, event for what's happening now (waking, pausing, error), stays the idle ones Napwake won't pause.
// Returns { at: 35 kinds by position (row by row from the top, left to right; '-stay' marks a room that keeps its
// light), rooms: rooms per kind, exact: true when each room is one workload }.
//   Up to 35 workloads: one room each, from the ground floor up, left to right, kind by kind; the rest shuttered.
//   Past 35: events take one room per workload, up to their share, by the street door; the steady kinds share the
//   rest by the largest remainder, each keeping at least one room, scattered by a fixed seed.
const FRONT = [31, 32, 30, 33, 29, 34, 28, 24, 25, 23, 26, 22, 27, 21];
function shuffled(seed, n) {
  const a = [...Array(n).keys()];
  let s = seed;
  for (let j = n - 1; j > 0; j--) { s = (s * 9301 + 49297) % 233280; const k = Math.floor(s / 233280 * (j + 1)); [a[j], a[k]] = [a[k], a[j]]; }
  return a;
}
export function plan(kinds, seed = 11) {
  const { ROOMS, ROWS, COLS } = BUILDING;
  const present = kinds.filter((x) => x.n > 0), total = present.reduce((t, x) => t + x.n, 0);
  const out = new Array(ROOMS), rooms = {};
  if (total <= ROOMS) {
    const order = [];
    for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) order.push(r * COLS + c);
    let p = 0;
    for (const x of present) { rooms[x.k] = x.n; for (let q = 0; q < x.n; q++) out[order[p++]] = q >= x.n - (x.stays || 0) ? x.k + '-stay' : x.k; }
    for (; p < ROOMS; p++) out[order[p]] = 'shut';
    return { at: out, rooms, exact: true, total };
  }
  let steady = present.filter((x) => !x.event), events = present.filter((x) => x.event);
  if (!steady.length) { steady = events; events = []; }
  let left = ROOMS;
  for (const x of events) { const r = Math.min(x.n, Math.max(1, Math.round(x.n / total * ROOMS))); rooms[x.k] = r; left -= r; }
  const sn = steady.reduce((t, x) => t + x.n, 0), rem = [];
  let given = 0;
  for (const x of steady) { const exact = x.n / sn * left, r = Math.max(1, Math.floor(exact)); rooms[x.k] = r; given += r; rem.push({ x, f: exact - Math.floor(exact) }); }
  rem.sort((a, b) => b.f - a.f || b.x.n - a.x.n);
  for (let i = 0; given < left; i = (i + 1) % rem.length) { rooms[rem[i].x.k]++; given++; }
  while (given > left) { const big = steady.slice().sort((a, b) => rooms[b.k] - rooms[a.k])[0]; rooms[big.k]--; given--; }
  const used = {};
  let p = 0;
  for (const x of events) for (let j = 0; j < rooms[x.k]; j++) { const at = FRONT[p++]; used[at] = 1; out[at] = x.k; }
  const free = shuffled(seed, ROOMS).filter((q) => !used[q]);
  let f2 = 0;
  for (const x of steady) {
    const r = rooms[x.k], stay = x.stays ? Math.min(x.stays, Math.max(1, Math.round(r * x.stays / x.n)), x.stays < x.n ? r - 1 : r) : 0;
    for (let j = 0; j < r; j++) out[free[f2++]] = j < r - stay ? x.k : x.k + '-stay';
  }
  return { at: out, rooms, exact: false, total };
}

// The lobby: the street door (door() at 1.25, its floor at y 0, its left edge at x 0) and the doorman beside it,
// never in front of it, his shadow falling away from the light. By the doorman rule he holds the street door, ajar
// and amber, only when a request woke a room ('door'); otherwise it's shut and he's on duty ('duty'), does the
// rounds on a scan ('rounds'), or rests his eyes when every room is asleep ('rest').
export function lobby(pose = 'rounds', T = THEME.dark, { shadow = '.3' } = {}) {
  const sc = BUILDING.STREET_SC, DW = BUILDING.DOOR_W * sc, DH = BUILDING.DOOR_H * sc, k = sc * 0.86;
  const d = door(pose === 'door' ? 'waking' : 'asleep', 0, 0, DW, DH, T, { sc });
  const tx = pose === 'door' ? DW * 0.5 - doorHand()[0] * k : -(pose === 'rounds' ? 34 : 26) - 40 * k;
  return d + `<path d="M${f(tx - 30 * k)} 0 H${f(tx + 34 * k)} L${f(tx - 90 * k)} ${f(30 * k)} H${f(tx - 170 * k)} Z" fill="${T.col.night}" style="opacity:${shadow}"/>` +
    `<g transform="translate(${f(tx)} 0) scale(${f(k)})">${figure({ ...POSES[pose], ground: false }, T.col)}</g>`;
}

// The building. at: from plan(). pose: the doorman's, for the lobby. off: idle rooms drawn already off (what
// Napwake would do). O: the shadow and wall-grain opacities (cast-shadow-dark, grain-dark). Returns its markup, in
// a BUILDING.W x BUILDING.H drawing; each room a <g class="room" data-k data-i> for a page to find.
export function building({ at, T = THEME.dark, pose = 'rounds', off = false, hand = true, grain = true, id = 'b' + Math.random().toString(36).slice(2, 7), O = {} } = {}) {
  const B = BUILDING, o = { shadow: '.3', grain: '.22', ...O };
  const x0 = B.M, ix0 = x0 + B.T, iw = B.BW - 2 * B.T, mass = T.wall;
  let s = '<defs>' + (hand ? handFilter(id + 'f', 1.4, 0.13) : '');
  if (grain) s += `<filter id="${id}g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>`;
  for (let r = 0; r < B.ROWS; r++) s += `<clipPath id="${id}c${r}"><rect x="${ix0}" y="${B.Y0 + r * B.STOREY}" width="${iw}" height="${B.STOREY - B.SLAB}"/></clipPath>`;
  s += `<clipPath id="${id}cl"><rect x="0" y="${B.LOBBY_Y}" width="${B.W}" height="${B.H - B.LOBBY_Y}"/></clipPath></defs>`;
  // the street, past the drawing's edges; the building's walls and cornice; the roofline, one arch over the middle
  // with a round window (the brand's arch and circle); each storey a corridor with its floor
  s += `<rect x="${-2 * B.W}" y="${B.GROUND}" width="${5 * B.W}" height="${B.STREET + 400}" fill="${T.floor}"/>`;
  s += `<rect x="${x0}" y="${B.Y0}" width="${B.BW}" height="${B.GROUND - B.Y0}" fill="${mass}"/><rect x="${x0 - 14}" y="${B.TOP}" width="${B.BW + 28}" height="${B.CORNICE}" fill="${mass}"/>`;
  const gw = 3 * B.PITCH + 40, gx = x0 + B.BW / 2 - gw / 2, gy = B.TOP - B.GABLE;
  s += `<path d="M${gx} ${B.TOP + 1} V${gy + gw / 2} A${gw / 2} ${gw / 2} 0 0 1 ${gx + gw} ${gy + gw / 2} V${B.TOP + 1} Z" fill="${mass}"/><circle cx="${x0 + B.BW / 2}" cy="${B.TOP - 52}" r="30" fill="${T.frame}"/>`;
  for (let r = 0; r < B.ROWS; r++) {
    const y = B.Y0 + r * B.STOREY;
    s += `<rect x="${ix0}" y="${y}" width="${iw}" height="${B.HEAD + B.DOOR_H}" fill="${T.wall}"/><rect x="${ix0}" y="${y + B.HEAD + B.DOOR_H}" width="${iw}" height="${B.FLOOR}" fill="${T.floor}"/>`;
  }
  s += `<rect x="${ix0}" y="${B.LOBBY_Y}" width="${iw}" height="${B.LOBBY}" fill="${T.wall}"/>`;
  if (grain) s += `<rect x="${ix0}" y="${B.Y0}" width="${iw}" height="${B.GROUND - B.Y0}" filter="url(#${id}g)" style="opacity:${o.grain}"/>`;
  s += hand ? `<g filter="url(#${id}f)">` : '<g>';
  for (let r = 0; r < B.ROWS; r++) {
    s += `<g clip-path="url(#${id}c${r})">`;
    for (let c = 0; c < B.COLS; c++) {
      const i = r * B.COLS + c, k = at[i] || 'shut', base = k.replace(/-stay$/, '');
      s += `<g class="room" data-k="${base}" data-i="${i}"${k !== base ? ' data-stays=""' : ''} transform="translate(${ix0 + B.P + c * B.PITCH} ${B.Y0 + r * B.STOREY + B.HEAD})">${room(base, T, { off: off && k === 'idle' })}</g>`;
    }
    s += '</g>';
  }
  const dx = f(x0 + B.BW / 2 - B.DOOR_W * B.STREET_SC / 2 + 46);
  s += `<g clip-path="url(#${id}cl)"><g class="lobby" transform="translate(${dx} ${B.GROUND})">${lobby(pose, T, { shadow: o.shadow })}</g></g></g>`;
  return s;
}
