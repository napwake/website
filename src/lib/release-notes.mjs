// What's new in each release, in plain words, written for the changelog page from the CHANGELOG's own
// entries (src/content/CHANGELOG.md). `summary` is 2 to 4 lines; each highlight names the CHANGELOG entry
// it comes from by the start of its text (`entry`), and links to it on the page. `held` names entries, by
// the start of their text, that stay off the page while the latest release candidate makes them untrue.
export const NOTES = {
  '0.2.0': {
    summary: [
      '0.2.0 is the relaunch: a fresh start, so install it new rather than upgrading from 0.1.x.',
      'Napwake pauses the workloads you opt in with a label after `idleAfter` with no sign of use. A request to a paused workload’s Service wakes it through the doorman, with a waking page for browsers. The forecast learns each workload’s week. With `autoResume`, it wakes them ahead of demand.',
      '`kubectl napwake scan` shows what’s idle with nothing installed, and Napwake reports what pausing freed apart from what came off the bill.',
    ],
    // P30: on v0.2.0-rc.7 the phase gauge keeps old phases at 1, so the stuck alert fires for workloads that
    // aren't stuck. The fix PR fixes it. Remove this once a release candidate with the fix is out.
    held: ['`napwake_workload_phase{'],
    highlights: [
      { title: 'Opt in with a label', text: 'On a Deployment, a StatefulSet or a whole namespace, with settings as annotations.', entry: 'Label opt-in' },
      { title: 'Wake on request', text: 'The doorman holds a request to a paused workload while it starts, at its own Service.', entry: 'Wake on request: a request to a paused workload' },
      { title: 'A waking page', text: 'Browsers see the address they opened and how long it has been starting.', entry: 'Waking-up page' },
      { title: 'Scan before you install', text: 'A read-only report on a cluster’s Deployments and StatefulSets, with nothing installed.', entry: '`kubectl napwake scan`: a read-only report' },
      { title: 'Freed, and saved', text: 'What a pause freed, apart from what it measurably took off the bill.', entry: 'Freed and saved' },
      { title: 'GitOps undoing a pause, reported', text: 'Argo CD, Flux, Fleet, kapp and Kluctl undoing a pause is reported with the fix.', entry: 'GitOps tools (Argo CD' },
    ],
  },
};
