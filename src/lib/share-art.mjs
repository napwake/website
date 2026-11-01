// The share pages' and cards' picture: the scan report's building (the rig's building()), close up at its street
// door. The building there is the cluster, one room per workload, and a share link carries no workloads, so this
// one shows none of its rooms, only the lobby the report draws under them. The street door is shut and the
// doorman stands beside it, never in front of it, as lobby() places him: doing the rounds for a scan (Napwake
// checks which rooms are empty), on duty for a status page (Napwake, running). Every colour is a token, so the
// page's night card and the build's card renderer resolve it alike. Drawn at build time.
import { figure, POSES, poseProps, handFilter } from './rig/doorman.mjs';
import { door, BUILDING } from './rig/scene.mjs';
import { DOORMAN, SCENE, tokenize } from './art.mjs';

const f = (n) => Math.round(n * 100) / 100;

// The drawing's frame, in the lobby's units: the street door's left edge at x 0, the street at y 0, and the
// street's kerb STREET below it. The card's own ground stands for the building's wall, as the report's card has
// it, so no wall is drawn.
export const ART = { x: -172, y: -236, w: 298, h: 256, street: 20 };

export function lobbyArt(pose = 'rounds', { id = 'sa', finish = true } = {}) {
  const sc = BUILDING.STREET_SC, DW = BUILDING.DOOR_W * sc, DH = BUILDING.DOOR_H * sc, k = sc * 0.86;
  // where lobby() stands him beside a shut street door
  const tx = -(pose === 'rounds' ? 34 : 26) - 40 * k;
  const p = { ...POSES[pose], ground: false, props: poseProps(pose, DOORMAN) };
  // the street, past the drawing's edges, so it meets a card's edges at any width (the svg's overflow shows it)
  const street = `<rect x="-4000" y="0" width="8000" height="400" fill="${SCENE.floor}"/>`;
  const shadow = `<path d="M${f(tx - 30 * k)} 0 H${f(tx + 34 * k)} L${f(tx - 90 * k)} ${f(30 * k)} H${f(tx - 170 * k)} Z" fill="var(--night)" style="opacity:var(--scene-cast)"/>`;
  const art = door('asleep', 0, 0, DW, DH, SCENE, { sc }) + `<g transform="translate(${f(tx)} 0) scale(${f(k)})">${figure(p, DOORMAN)}</g>`;
  const body = finish ? `<defs>${handFilter(id, 1.3, 0.13)}</defs>${street}${shadow}<g filter="url(#${id})">${art}</g>` : street + shadow + art;
  return tokenize(body);
}

export const viewBox = `${ART.x} ${ART.y} ${ART.w} ${ART.h}`;

// The dark theme's tokens from tokens.css, as one style attribute: the result's card and the preview card are a
// night scene in both themes, as the report's building is, and carry every dark value.
export function nightVars(tokensCss) {
  const dark = tokensCss.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)[1].replace(/\s+/g, ' ').trim();
  return `${dark} --scene-cast: var(--cast-shadow-dark); --scene-grain: var(--grain-dark); color-scheme: dark;`;
}
