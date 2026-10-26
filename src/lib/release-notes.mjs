// What's new in each release, in plain words, written for the changelog page from the CHANGELOG's own
// entries (src/content/CHANGELOG.md). `summary` is 2 to 4 lines; each highlight names the CHANGELOG entry
// it comes from by the start of its text (`entry`), and links to it on the page. `held` names entries, by
// the start of their text, that stay off the page while the latest release candidate makes them untrue.
export const NOTES = {
  '0.2.0': {
    summary: [
      'Napwake pauses idle Kubernetes workloads in staging, preview and dev, and wakes them on the first request. It never deletes a workload or its data.',
      '0.2.0 is the first release as Napwake, and a fresh start after the 0.1.x experiments.',
      'From 0.2.0-rc.9, `helm upgrade` works in place. From Hybernate 0.1.x or its release candidates rc.1 to rc.7, uninstall, then install Napwake and opt your workloads in again.',
    ],
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
