// How it compares, by approach (CMO decision 0006, 2026-10-23): Napwake, a timetable, and a scale-to-zero proxy.
// Tools appear only as small-print examples of an approach, so a search still finds the page. No stars, versions,
// licences, praise or links. Every line about the other two approaches is from Kede's positioning research (HQ:
// hybernate/cmo/work/2026-10-22-brand-foundation/positioning.md, each tool's own docs, checked 2026-10-22), said as
// "most" or "typically" where the tools differ. Napwake's lines are from its docs.
// The scene's data lives here too: the page draws every state at build time, and the browser only switches them.

export const CHECKED = '2026-10-22';

export const ROOMS = ['dev', 'staging', 'pr-42', 'qa'];

// Napwake first: a reader who never scrolls past the first row sees it, and the others read as what you'd get instead.
export const APPROACHES = [
  { key: 'napwake', name: 'Napwake', also: 'Pauses on use, and wakes on the first request at the Service, with a forecast.' },
  { key: 'timetable', name: 'A timetable', also: 'Such as a CronJob, kube-green or kube-downscaler.' },
  { key: 'proxy', name: 'A scale-to-zero proxy', also: 'Such as KEDA’s HTTP add-on, Sablier or Knative.' },
];

// ---------- time: minutes after Monday 17:00, through the night to Tuesday 09:30 ----------
export const START = 17 * 60;
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return ((h * 60 + m - START) + 1440) % 1440; };
export const END = toMin('09:30');
export const clock = (t) => { const a = (START + t) % 1440; return `${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };
export const day = (t) => (START + t >= 1440 ? 'Tue' : 'Mon');
export const dayLong = (t) => (START + t >= 1440 ? 'Tuesday' : 'Monday');

// ---------- what each room is doing, approach by approach ----------
// active: in use, a guest in the light · idle: lit for nobody · asleep · waking: waking up, ajar and amber
// out: asleep, with someone outside the dark door (the guest, shut out of a room still in use)
// The story is the same in every row. The team leaves dev at 17:30 and staging at 17:50. qa's queue worker is busy,
// with no requests, until 19:20. Someone works late in pr-42 until 21:30. Someone opens staging at 22:15 and
// leaves at 22:45. The team is back in dev and staging at 09:00. Nobody uses pr-42 or qa on Tuesday.
const S = (...steps) => steps.map(([at, s]) => [toMin(at), s]);
export const TIMELINE = {
  // sleepAt 20:00 and wakeUpAt 08:00, kube-green's own example. The clock decides, and a request wakes nothing.
  timetable: {
    dev: S(['17:00', 'active'], ['17:30', 'idle'], ['20:00', 'asleep'], ['08:00', 'idle'], ['09:00', 'active']),
    staging: S(['17:00', 'active'], ['17:50', 'idle'], ['20:00', 'asleep'], ['22:15', 'out'], ['22:35', 'asleep'], ['08:00', 'idle'], ['09:00', 'active']),
    'pr-42': S(['17:00', 'active'], ['20:00', 'out'], ['21:30', 'asleep'], ['08:00', 'idle']),
    qa: S(['17:00', 'active'], ['19:20', 'idle'], ['20:00', 'asleep'], ['08:00', 'idle']),
  },
  // Off soon after the last request, drawn as 15 minutes. Knative's grace period is 30 s; Sablier's session and
  // KEDA's cooldown are set per app. An HTTP request wakes a room, held while it starts.
  proxy: {
    dev: S(['17:00', 'active'], ['17:30', 'idle'], ['17:45', 'asleep'], ['09:00', 'waking'], ['09:02', 'active']),
    staging: S(['17:00', 'active'], ['17:50', 'idle'], ['18:05', 'asleep'], ['22:15', 'waking'], ['22:17', 'active'], ['22:45', 'idle'], ['23:00', 'asleep'], ['09:00', 'waking'], ['09:02', 'active']),
    'pr-42': S(['17:00', 'active'], ['21:30', 'idle'], ['21:45', 'asleep']),
    qa: S(['17:00', 'active'], ['17:15', 'out'], ['19:20', 'asleep']),
  },
  // idleAfter 1h, the default. pr-42's late work shows as deploys. The doorman holds the late request to staging,
  // and the visitor's own requests aren't seen while it's awake, so it pauses an hour after the one that woke it.
  // With autoResume, the forecast wakes the team's rooms at 08:45.
  napwake: {
    dev: S(['17:00', 'active'], ['17:30', 'idle'], ['18:30', 'asleep'], ['08:45', 'idle'], ['09:00', 'active']),
    staging: S(['17:00', 'active'], ['17:50', 'idle'], ['18:50', 'asleep'], ['22:15', 'waking'], ['22:17', 'active'], ['22:45', 'idle'], ['23:15', 'asleep'], ['08:45', 'idle'], ['09:00', 'active']),
    'pr-42': S(['17:00', 'active'], ['21:30', 'idle'], ['22:30', 'asleep']),
    qa: S(['17:00', 'active'], ['19:20', 'idle'], ['20:20', 'asleep']),
  },
};
const lastAt = (steps, t) => { let v = steps[0][1]; for (const [at, s] of steps) if (at <= t) v = s; return v; };
export const stateAt = (approach, room, t) => lastAt(TIMELINE[approach][room], t);

// The doorman, in Napwake's row, follows the rooms he minds. He holds staging's door while a request wakes it, reads
// the morning list before the team, rests his eyes when every room is asleep, and checks his watch while a room is
// lit for nobody. Otherwise he's on duty.
export function poseAt(t) {
  const s = ROOMS.map((r) => stateAt('napwake', r, t));
  if (s[1] === 'waking') return 'door';
  if (t >= toMin('08:45') && t < toMin('09:00')) return 'list';
  if (s.every((x) => x === 'asleep')) return 'rest';
  if (s.includes('idle')) return 'watch';
  return 'duty';
}
export const POSES = ['duty', 'watch', 'door', 'list', 'rest'];

// the timetable's switch: off at 20:00, on at 08:00
export const switchAt = (t) => (t >= toMin('20:00') && t < toMin('08:00') ? 'off' : 'on');

// ---------- the words ----------
// Under each door, in the brand's plain words. "out" is an asleep door; the line for screen readers says who's there.
export const WORD = { active: 'in use', idle: 'lit for nobody', asleep: 'asleep', waking: 'waking up', out: 'asleep' };
export const TONE = { active: 'awake', idle: 'awake', asleep: 'asleep', waking: 'waking', out: 'asleep' };
export const SAY = { active: 'in use', idle: 'lit for nobody', asleep: 'asleep', waking: 'waking up', out: 'asleep, with someone at its door' };
export const POSE_SAY = {
  duty: 'The doorman is on duty beside staging.',
  watch: 'The doorman checks his watch. Napwake counts how long a room has been idle.',
  door: 'The doorman holds staging’s door while it wakes.',
  list: 'The doorman reads the morning list. Napwake wakes the rooms it expects busy.',
  rest: 'Every room is asleep, and the doorman rests his eyes.',
};
export const describe = (approach, t) => {
  const rooms = ROOMS.map((r) => `${r} ${SAY[stateAt(approach, r, t)]}`).join(', ') + '.';
  if (approach === 'timetable') return `The switch is ${switchAt(t)}. ${rooms}`;
  return approach === 'napwake' ? `${rooms} ${POSE_SAY[poseAt(t)]}` : rooms;
};

// One line per row, by the time, in plain words. By the doorman's rule, he only holds the door, wakes a room on the
// first request, or asks first. Everything else is "Napwake …".
const C = (...lines) => lines.map(([at, text]) => [toMin(at), text]);
export const CAPTIONS = {
  timetable: C(
    ['17:00', 'Every room stays on until the off time, 20:00.'],
    ['17:30', 'dev and staging are lit for nobody. The timetable keeps them on until 20:00.'],
    ['20:00', 'At 20:00 every light goes out, pr-42’s too. Someone was still working there.'],
    ['21:30', 'Every room is dark until 08:00.'],
    ['22:15', 'Someone opens staging at 22:15. Nothing answers until 08:00.'],
    ['22:35', 'Every room is dark until 08:00.'],
    ['08:00', 'At 08:00 every room comes back on, pr-42 and qa too. Nobody will use them today.'],
    ['09:00', 'The team is in. pr-42 and qa stay lit for nobody until 20:00.'],
  ),
  proxy: C(
    ['17:00', 'Requests reach these rooms through the proxy. Your Ingress or routes point at it.'],
    ['17:15', 'qa’s queue worker is busy, with no requests. Most proxies count only requests, so it’s paused mid-job.'],
    ['17:45', 'dev and staging go dark soon after their last request. qa’s worker is still shut out.'],
    ['19:20', 'pr-42 stays lit while someone’s requests keep coming.'],
    ['21:45', 'Every room is dark until a request comes.'],
    ['22:15', 'An HTTP request wakes staging at 22:15. The proxy typically holds it while staging starts.'],
    ['22:17', 'staging is up. Most proxies wake only on HTTP, so a database client couldn’t have woken it.'],
    ['23:00', 'Every room is dark until a request comes.'],
    ['09:00', 'The team’s first requests wake dev and staging. The first person at each waits while it starts.'],
    ['09:02', 'dev and staging are up. pr-42 and qa stay dark, since nobody asks for them.'],
  ),
  napwake: C(
    ['17:00', 'Napwake keeps an activity clock for every room. CPU, deploys, your tools’ annotations and Prometheus queries, such as request rate, all count.'],
    ['17:30', 'Nobody has used dev since 17:30. Napwake pauses it once `idleAfter` passes.'],
    ['18:30', 'qa’s queue worker has no requests, but its CPU counts as use. qa stays on.'],
    ['19:20', 'qa’s job is done at 19:20. Napwake pauses it once `idleAfter` passes.'],
    ['20:20', 'Someone is working late in pr-42. Their deploys count as use, so Napwake leaves it lit.'],
    ['21:30', 'The last deploy to pr-42 was at 21:30. Napwake pauses it at 22:30.'],
    ['22:15', 'A request for staging at 22:15. The doorman holds it while staging wakes.'],
    ['22:17', 'staging is up for the late visitor. The request that woke it is the last use Napwake sees, so staging pauses at 23:15.'],
    ['23:15', 'Every room is asleep. A request at any hour wakes the room it’s for.'],
    ['08:45', 'The forecast expects the team at 09:00. With `autoResume`, Napwake wakes dev and staging at 08:45.'],
    ['09:00', 'The team walks into rooms that are already up. pr-42 and qa sleep on.'],
  ),
};
export const captionAt = (approach, t) => lastAt(CAPTIONS[approach], t);

// The moments Next and Back step through, one per beat of the story, and the first, which the page opens on.
// Each sits just after its event, so the picture has changed. Nothing moves until the reader asks.
export const MOMENTS = ['17:00', '17:20', '18:35', '20:05', '20:25', '22:16', '23:50', '08:05', '08:50', '09:05'].map(toMin);
export const DEFAULT = MOMENTS[0];

// ---------- what only Napwake does, each with the pose that earns it ----------
// state is the rig's: awake with nobody in it is lit for nobody
export const ONLY = [
  { pose: 'watch', state: 'awake', title: 'It pauses on use.', text: 'Napwake counts how long a room has been idle. CPU, deploys, your own tools and Prometheus queries, such as request rate, all count as use.',
    alt: 'The doorman checks his watch beside a room lit for nobody. Napwake counts how long a room has been idle.' },
  { pose: 'door', state: 'waking', title: 'It wakes on the first request.', text: 'At the Service, for any TCP: HTTP, gRPC, Postgres, Redis. The doorman holds the request while the room wakes. Your Ingress doesn’t change.',
    alt: 'The doorman holds the door of a room that is waking up, its amber light on the floor.' },
  { pose: 'list', state: 'awake', listTime: '08:45', title: 'The room is ready before the team.', text: 'Napwake learns each room’s week. With `autoResume`, it wakes a room 15 minutes before an hour it expects busy.',
    alt: 'The doorman reads the morning list beside a lit room. Napwake wakes rooms before the team arrives.' },
  { pose: 'ask', state: 'asleep', title: 'On a public URL, it can ask first.', text: 'Set `napwake.dev/wake: ask`, and the doorman asks before he wakes a room. A browser gets a Wake it button, so a person wakes it and robots don’t.',
    alt: 'The doorman asks at a shut door, his hand flat on it.' },
  { pose: 'rest', state: 'asleep', title: 'It never deletes anything.', text: 'A pause scales a workload to zero. Only the pods go. The workload, its Services and its data stay.',
    alt: 'The doorman rests his eyes beside an asleep room, with everything still in it.' },
];

// ---------- the table: three approaches, five questions ----------
export const TABLE = [
  { q: 'What decides', timetable: 'The clock. A schedule turns rooms off and on at set times.',
    proxy: 'Requests through the proxy. A room with none for a while is turned off.',
    napwake: 'Use. CPU, deploys, your tools’ annotations and Prometheus queries, such as request rate. Paused after `idleAfter` with none.' },
  { q: 'What wakes it', timetable: 'The clock, at the on time.',
    proxy: 'An HTTP request through the proxy.',
    napwake: 'The first request at the Service, for any TCP. On a public URL set to ask, a person’s click. Or, with `autoResume`, the forecast, 15 minutes early.' },
  { q: 'What the first person sees', timetable: 'Out of hours, nothing answers. In hours, the room is on, used or not.',
    proxy: 'A slow first response while the room starts. Some show a waiting page.',
    napwake: 'Usually one slow response while it starts. A browser gets a waking page. A room the forecast woke is already up.' },
  { q: 'What you change in your setup', timetable: 'An operator or a CronJob, and a schedule for each namespace or workload. Nothing sits in the request path.',
    proxy: 'The proxy, with your Ingress or routes sent through it and a route or an object per app. Some need apps redeployed in their own format.',
    napwake: 'A Helm install, metrics-server, and a label on a workload or namespace. Apps need readiness probes. Your Ingress, Services and DNS stay as they are.' },
  { q: 'What happens to work with no traffic', timetable: 'It stops at the off time, finished or not.',
    proxy: 'Most count only requests, so a busy queue worker looks idle and can be paused mid-job.',
    napwake: 'It stays on while its CPU is busy, or while your tools mark it in use.' },
];
