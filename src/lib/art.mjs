// The brand's rig (src/lib/rig, synced from the design system), with every colour as a token from
// tokens.css, so one drawing serves light and dark. The same approach as the design system's ScenePanel
// and StateDoor components. Drawn at build time; the pages ship plain SVG.
import { figure, POSES, handFilter, poseProps, PROPS } from './rig/doorman.mjs';
import { door, labelsFor, doorHand, glyph } from './rig/scene.mjs';

export const DOORMAN = {
  coat: 'var(--doorman-coat)', coatDk: 'var(--doorman-coat-deep)', face: 'var(--doorman-face)', brass: 'var(--doorman-brass)',
  night: 'var(--doorman-night)', hatCol: 'var(--doorman-hat)', glove: 'var(--doorman-mitten)', gloveLine: 'var(--doorman-mitten-line)',
  eye: 'var(--doorman-eye)', shoe: 'var(--doorman-shoe)', shoeRim: 'var(--doorman-shoe-rim)', paper: 'var(--paper)',
};
export const SCENE = {
  wall: 'var(--scene-wall)', floor: 'var(--scene-floor)', frame: 'var(--scene-frame)', leaf: 'var(--scene-leaf)', leafEdge: 'var(--scene-leaf-edge)',
  knob: 'var(--scene-knob)', amberRoom: 'var(--scene-room-amber)', amber: 'var(--scene-amber)', greenRoom: 'var(--scene-room-green)',
  green: 'var(--scene-green)', greenGlow: 'var(--scene-green-glow)', label: 'var(--scene-label)', guest: 'var(--scene-guest)',
  st: { asleep: 'var(--asleep)', waking: 'var(--waking)', awake: 'var(--awake)', error: 'var(--error)' },
  col: DOORMAN, note: 'var(--paper)',
};

// The few colours the rig writes as literals (props, highlights, shading), mapped to their tokens.
const LITERALS = {
  '#8A5A2B': 'prop-clipboard', '#B9B4A7': 'prop-plate-edge', '#9C978A': 'prop-switch', '#D9443A': 'note-pin',
  '#2E9F62': 'scene-green', '#FFE3A1': 'scene-room-amber', '#5B6B86': 'scene-leaf', '#F5B53F': 'lamp',
  '#0F1716': 'night', '#FFFFFF': 'doorman-eye', '#FFF': 'doorman-eye', '#000': 'night', '#FFF6DD': 'scene-room-amber',
};
export const tokenize = (svg) => svg.replace(/"(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})"/g, (m, hex) => {
  const t = LITERALS[hex.toUpperCase()];
  return t ? `"var(--${t})"` : m;
});

const GLYPH = { '#5B6B86': 'glyph-slate', '#F5B53F': 'glyph-amber', '#2E9F62': 'glyph-green', '#D9443A': 'glyph-red', '#FFE3A1': 'glyph-room-amber', '#DDF3E3': 'glyph-room-green', '#4A5872': 'glyph-leaf', '#F8F8F5': 'paper' };
export const glyphMarkup = (state) => glyph(state, 'light').replace(/#[0-9A-Fa-f]{6}/g, (m) => (GLYPH[m.toUpperCase()] ? `var(--${GLYPH[m.toUpperCase()]})` : m));

const f = (n) => Math.round(n * 100) / 100;
let seq = 0;
const uid = (p) => `${p}${++seq}`;

// The finish (wobble and grain), and a wall grain whose strength follows the theme through --scene-grain.
const finishDefs = (id, wobble, grain) => handFilter(id, wobble, grain);
const wallGrain = (id, w, h) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter><rect width="${w}" height="${h}" filter="url(#${id})" style="opacity:var(--scene-grain)"/>`;

// The corridor, as the rig's corridor() draws it, with the doorman in any pose beside his door.
// rooms: [{ state, label }]. doormanAt: the index of his door. pose: one of the rig's poses.
// include(i) picks which rooms to draw (all by default), so a scene can be split into a still layer and moving ones.
export function corridor({ w = 1280, h = 400, rooms, x0 = 40, floorY = null, sc = 1, doormanAt = -1, pose = 'door', labels = true, stateLabels = true, finish = true, wall = true, props = false, shiftDoorman = null, include = () => true, doorman = true, breathe = false, listTime = null } = {}) {
  const T = SCENE, dw = 78 * sc, dh = 156 * sc, gap = 30 * sc, pgap = 112 * sc, fy = floorY ?? h - 46 * sc;
  let x = x0, art = '', txt = '', figs = '';
  rooms.forEach((rm, i) => {
    if (i === doormanAt) x += pgap - gap;
    if (include(i)) {
      let d = door(rm.state, x, fy, dw, dh, T, { sc });
      if (rm.guest && rm.state === 'awake') d += guest(x, fy, sc);
      if (breathe && rm.state === 'waking') d = d.replace(`fill="${T.amber}" opacity=".55"`, `fill="${T.amber}" class="wedge"`);
      art += d;
      if (labels || stateLabels) txt += labelsFor(rm.state, x, fy, dw, dh, T, labels ? rm.label : null, sc, stateLabels);
    }
    if (i === doormanAt && doorman) {
      const [hx] = doorHand(), k = sc * 0.86;
      // at a waking door his mitten holds the leaf; in any other pose he stands in the gap beside the door, never in front of it
      const shift = shiftDoorman ?? (pose === 'door' ? 0 : -34);
      const tx = x + dw * 0.5 - hx * k + shift * sc;
      figs += `<path d="M${f(tx - 30 * k)} ${f(fy)} H${f(tx + 34 * k)} L${f(tx - 90 * k)} ${f(fy + 30 * k)} H${f(tx - 170 * k)} Z" fill="var(--night)" style="opacity:var(--scene-cast)"/>`;
      const p = { ...POSES[pose], ground: false };
      if (props) p.props = poseProps(pose, DOORMAN);
      let fig = figure(p, DOORMAN);
      if (listTime) fig = fig.replace('>07:45<', `>${listTime}<`);
      figs += `<g transform="translate(${f(tx)} ${f(fy)}) scale(${f(k)})">${fig}</g>`;
    }
    x += dw + gap;
  });
  const fid = uid('fin'), gid = uid('grn');
  const bg = wall ? `<rect width="${w}" height="${h}" fill="${T.wall}"/><rect y="${f(fy)}" width="${w}" height="${f(h - fy)}" fill="${T.floor}"/>` : '';
  const body = finish
    ? `<defs>${finishDefs(fid, 1.4, 0.13)}</defs>${wall ? wallGrain(gid, w, h) : ''}<g filter="url(#${fid})">${art}${figs}</g>`
    : art + figs;
  return tokenize(bg + body + txt);
}

// Someone in a lit room: in use, as the scan report's building draws it (proposed for the design system, reports
// ds-additions.md): a guest standing back in the light, an arch and a circle in Night. An awake room without one is
// lit for nobody.
export function guest(x, fy, sc = 1) {
  const g = (n) => f(n * sc), y = fy - 156 * sc, bx = x + g(43), by = y + g(101), bw = g(24), bh = g(51);
  return `<path d="M${f(bx)} ${f(by + bh)} V${f(by + bw / 2)} A${f(bw / 2)} ${f(bw / 2)} 0 0 1 ${f(bx + bw)} ${f(by + bw / 2)} V${f(by + bh)} Z" fill="var(--scene-guest)"/>` +
    `<circle cx="${f(x + g(55))}" cy="${f(y + g(88))}" r="${g(9.5)}" fill="var(--scene-guest)"/>`;
}

// The same guest, shut out: standing on the corridor floor in front of the shut door's right half, nearer to us, so
// larger than one standing back in a room. A rim in scene-label keeps the silhouette on Night in the dark theme,
// where Night on the dark leaf would vanish (a proposal for the design system; the guest is "building only" in v13).
export function guestOutside(x, fy, sc = 1) {
  const g = (n) => f(n * sc), bw = g(30), bh = g(66), bx = x + g(54), by = fy + g(5) - bh, r = g(12.5);
  const rim = `stroke="var(--scene-label)" stroke-width="${g(2)}"`;
  return `<path d="M${f(bx)} ${f(by + bh)} V${f(by + bw / 2)} A${f(bw / 2)} ${f(bw / 2)} 0 0 1 ${f(bx + bw)} ${f(by + bw / 2)} V${f(by + bh)} Z" fill="var(--scene-guest)" ${rim}/>` +
    `<circle cx="${f(bx + bw / 2)}" cy="${f(by - r - g(3))}" r="${r}" fill="var(--scene-guest)" ${rim}/>`;
}

// One room drawn in every picture at once, as layers a page switches with data-s on the group, so a scene is drawn
// once and only its states change. The layers are the design system's room() (v13): the frame and the dark room
// stay; r-lit is the room's light, with r-guest standing in it when it's in use; r-open is the leaf against the
// wall; r-lamp the lamp over the door; r-wake the room waking up (amber, ajar, the wedge); r-shut the closed leaf,
// folded to its hinge until a room goes dark; r-out the guest outside the shut door. Drawn at x = 0 and moved into
// place, so the leaf folds about its hinge. The CSS that turns the lights off, light first, is the page's.
const archD = (x, y, w, h) => `M${f(x)} ${f(y + h)} V${f(y + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w / 2)} V${f(y + h)} Z`;
export function roomLayers(x, fy, { sc = 1, filter = null, state = 'asleep', name = '' } = {}) {
  const dw = 78 * sc, dh = 156 * sc, T = SCENE;
  const parts = (s) => door(s, 0, fy, dw, dh, T, { sc }).match(/<(path|circle|rect)\b[^>]*\/>/g);
  const A = parts('asleep'), K = parts('awake'), W = parts('waking');
  const wedge = W[2].replace(` opacity=".55"`, ' class="wedge"');
  const layers =
    A[0] + `<path d="${archD(0, fy - dh, dw, dh)}" fill="${T.floor}"/>` +
    `<g class="r-lit">${K[1]}${K[2]}</g><g class="r-guest">${guest(0, fy, sc)}</g>` +
    `<g class="r-open">${K[3]}</g><g class="r-lamp">${K[4]}${K[5]}</g>` +
    `<g class="r-wake">${W[1]}${wedge}${W[3]}${W[4]}</g>` +
    `<g class="r-shut">${A[1]}${A[2]}${A[3]}</g>` +
    `<g class="r-out">${guestOutside(0, fy, sc)}</g>`;
  return tokenize(`<g class="nr" data-room="${name}" data-s="${state}" transform="translate(${f(x)} 0)"${filter ? ` filter="url(#${filter})"` : ''}>${layers}</g>`);
}

// The light switch on a corridor's wall, from the rig's props: one for a whole floor, as a timetable is.
export function wallSwitch(cx, cy, { k = 1.6 } = {}) {
  const at = (on) => `<g class="sw sw--${on ? 'on' : 'off'}" transform="translate(${f(cx)} ${f(cy)}) scale(${k})">${PROPS.switchplate(0, 0, on, DOORMAN)}</g>`;
  return tokenize(at(true) + at(false));
}

// The doorman alone, in a pose, where corridor() would stand him beside door doormanAt, with the finish: a layer
// for a scene whose rooms are drawn on their own.
export function doormanLayer(o) {
  return corridor({ ...o, include: () => false, wall: false, labels: false, stateLabels: false });
}

// the finish, for a page that draws its own groups and applies it to each
export const finishFilter = (id, wobble = 1.4, grain = 0.13) => finishDefs(id, wobble, grain);

// The width the corridor's doors take, to centre a set of rooms in a drawing.
export function corridorWidth(n, { sc = 1, doormanAt = -1 } = {}) {
  const dw = 78 * sc, gap = 30 * sc, pgap = 112 * sc;
  return n * dw + (n - 1) * gap + (doormanAt >= 0 ? pgap - gap : 0);
}

// One pose on its own, as the pose files are drawn (240 x 260), with the finish.
export function pose(name, { finish = true, props = true, w = 240, h = 260, floor = 244, cx = 100, ground = true } = {}) {
  const p = { ...POSES[name], ground };
  if (props) p.props = poseProps(name, DOORMAN);
  const id = uid('pf');
  const inner = `<g transform="translate(${cx} ${floor})"${finish ? ` filter="url(#${id})"` : ''}>${figure(p, DOORMAN)}</g>`;
  return { viewBox: `0 0 ${w} ${h}`, markup: tokenize((finish ? `<defs>${finishDefs(id, 1.3, 0.13)}</defs>` : '') + inner) };
}

// A single arched door in a state, larger than a glyph, with the finish: for cards and diagrams.
export function room(state, { w = 160, h = 200, dw = 78, dh = 156, label = null, stateLabel = false, finish = true, wall = false, floor = true } = {}) {
  const fy = h - 30, x = (w - dw) / 2;
  const fid = uid('rf');
  let s = '';
  if (wall) s += `<rect width="${w}" height="${h}" fill="${SCENE.wall}"/>`;
  if (floor) s += `<rect y="${fy}" width="${w}" height="${h - fy}" fill="${SCENE.floor}"/>`;
  const art = door(state, x, fy, dw, dh, SCENE, {});
  s += finish ? `<defs>${finishDefs(fid, 1.3, 0.13)}</defs><g filter="url(#${fid})">${art}</g>` : art;
  if (label || stateLabel) s += labelsFor(state, x, fy, dw, dh, SCENE, label, 1, stateLabel);
  return tokenize(s);
}

export const WORDS = {
  plain: { asleep: 'Asleep', waking: 'Waking up', awake: 'Awake', error: 'Needs you' },
  product: { asleep: 'paused', waking: 'resuming', awake: 'running', error: 'needs attention' },
};
export const describeRooms = (rooms) => rooms.map((r) => `${r.label} ${WORDS.plain[r.state].toLowerCase()}`).join(', ');
