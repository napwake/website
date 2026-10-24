// The FAQ: the questions people ask assistants, each answered so it stands on its own. Napwake's side
// from the product docs (origin/main 4f35500, 2026-10-22), each page named in `sources`. Other approaches are
// compared as approaches, with tools only as examples and no links to them (CMO decision 0006, 2026-10-23),
// from Kede's positioning research, checked 2026-10-22.
// Markup in answers: `code` and [text](href). plain() gives the same words as text, for JSON-LD and llms.txt.
import { doc, links } from './links.mjs';

export const FAQ = [
  {
    id: 'scale-staging-to-zero-at-night',
    q: 'How do I scale staging to zero at night in Kubernetes?',
    short: 'On a timetable, or on use. A timetable turns everything off at set times, used or not. Napwake pauses each workload after `idleAfter` with no sign of use, an hour by default, nights and weekends included. The first request wakes it again.',
    a: [
      'On a timetable, or on use. A timetable turns everything off at a set time and back on at another, such as a CronJob that runs `kubectl scale --replicas=0` at night, or kube-green. It can’t tell a room someone is using from an empty one.',
      'Napwake works on use instead. CPU, deploys, your tools’ annotations and Prometheus queries, such as request rate, count as use. It pauses each workload after `idleAfter` with none, an hour by default, nights and weekends included. The first request wakes it again, so nobody has to know the hours. With `autoResume`, it also wakes workloads 15 minutes before an hour its forecast expects to be busy.',
      '[How it compares](/compare/) shows Napwake, a timetable and a scale-to-zero proxy through one evening.',
    ],
    sources: [['Idle detection', doc('concepts/idle-detection')], ['Forecasting', doc('concepts/forecasting')]],
  },
  {
    id: 'does-it-delete-anything',
    q: 'Does Napwake delete anything?',
    short: 'No. Its one action is to pause, which scales a workload to zero replicas. The workload, its Services, its PVCs and their data stay. Only the pods are removed.',
    a: [
      'No. Its one action is to pause, which scales a workload to zero replicas. The Deployment or StatefulSet stays, and so do its Services, its PVCs and their data. Only the pods are removed.',
      'It never pauses a StatefulSet whose PVCs would be deleted on scale-down (`persistentVolumeClaimRetentionPolicy.whenScaled: Delete`), and it records what a pause changes before anything is scaled, so a resume goes back to the replica count the workload had.',
    ],
    sources: [['Pause and resume', doc('guides/pause')], ['Lifecycle', doc('concepts/lifecycle')]],
  },
  {
    id: 'first-request',
    q: 'What happens to the first request to a paused workload?',
    short: 'It waits at the door. Napwake’s doorman holds the connection while the workload starts, then passes it through. The caller usually sees one slow response, and no error.',
    a: [
      'It waits at the door. While a workload is paused, its Services point at Napwake’s doorman, which holds the connection while the workload starts, then passes it to one of its Ready pods. The caller usually sees one slow response, and no error.',
      'The doorman holds a connection for up to 2 minutes by default (`wake.maxWait`) and works on TCP, so HTTP, gRPC, Postgres and Redis alike. Browsers get a page saying the environment is starting, which reloads every 3 seconds. The app needs a readiness probe that passes only once it can serve, and behind ingress-nginx, a workload that takes longer than 60 seconds to start needs a longer `proxy-read-timeout`.',
    ],
    sources: [['Wake on request', doc('concepts/wake-on-request')]],
  },
  {
    id: 'schedule-or-proxy',
    q: 'How is Napwake different from a timetable or a scale-to-zero proxy?',
    short: 'A timetable turns everything off at set times, used or not. A scale-to-zero proxy decides on the HTTP requests that pass through it. Napwake pauses on use, CPU and deploys included, and wakes on the first request at the Service, for any TCP, with no change to your Ingress.',
    a: [
      'A timetable, such as a CronJob or kube-green, turns rooms off and on at set times. Someone working late is turned off with everyone else, and a room nobody needs comes back on in the morning.',
      'A scale-to-zero proxy, such as KEDA’s HTTP add-on, Sablier or Knative, sits in the request path. Your Ingress or routes go through it, and most wake only on HTTP. Most also count only requests, so a busy worker with no traffic looks idle.',
      'Napwake pauses on use. CPU, deploys, your tools’ annotations and Prometheus queries, such as request rate, all count. It wakes on the first request at the workload’s Service, for any TCP, and your Ingress doesn’t change. With `autoResume`, its forecast wakes the team’s rooms before they arrive. On a public URL, it can ask first.',
      '[How it compares](/compare/) shows all three through one evening and the next morning.',
    ],
    sources: [['Idle detection', doc('concepts/idle-detection')], ['Wake on request', doc('concepts/wake-on-request')], ['Forecasting', doc('concepts/forecasting')]],
  },
  {
    id: 'argo-cd-and-flux',
    q: 'Does Napwake work with Argo CD or Flux?',
    short: 'Yes, once the tool is told to leave replicas alone, a one-time setting. If a GitOps tool undoes a pause, Napwake reports how to fix it, and never fights Git.',
    a: [
      'Yes. Its label and settings live in the manifests you already keep in Git. A pause sets replicas to zero, so a GitOps tool that applies `replicas` from Git would undo it. Tell it once to leave them alone. In Argo CD, ignore `/spec/replicas` for Deployments and StatefulSets in `argocd-cm` and add `RespectIgnoreDifferences=true` to each app’s sync options. With Flux, leave `replicas` out of the manifest. Teams that already run an HPA under Argo CD or Flux usually have this in place.',
      'Napwake never fights Git. When a tool undoes a pause, it reports a `GitOpsConflict` with the fix and waits an hour before pausing again. Fleet, kapp and Kluctl are covered too, and `kubectl napwake scan` lists the workloads whose replicas are set from Git before you opt anything in.',
    ],
    sources: [['GitOps tools', doc('guides/gitops')]],
  },
  {
    id: 'gke-and-eks',
    q: 'Does Napwake work on GKE or EKS?',
    short: 'Yes, on Kubernetes 1.30 and later. On EKS, install metrics-server. On GKE, a Service in container-native load balancing (NEGs) needs the optional forwarder to wake on a request.',
    a: [
      'Yes, on Kubernetes 1.30 and later. Napwake reads CPU from metrics-server, which GKE and AKS run by default and EKS doesn’t. On EKS, add the metrics-server add-on. Behind the AWS Load Balancer Controller, both target types, instance and ip, reach the doorman (checked against its source).',
      'On GKE, Services no GKE Ingress uses are routed like any other. A Service a GKE Ingress or Gateway uses through container-native load balancing (NEGs) isn’t, by default. Turn on the optional forwarder (`doorman.negForwarder.enabled`), or reach the workload through an ingress controller that reads EndpointSlices, such as ingress-nginx.',
    ],
    sources: [['Installation', doc('getting-started/installation')], ['Quickstart', doc('getting-started/quickstart')], ['Compatibility', doc('reference/compatibility')], ['Wake on request, on GKE', doc('concepts/wake-on-request')]],
  },
  {
    id: 'production',
    q: 'Is Napwake for production?',
    short: 'No. It’s for non-production: staging, preview and dev. It pauses and resumes. Scaling under load is an HPA’s or KEDA’s job.',
    a: [
      'No. It’s built for non-production: staging, preview and dev. The first request to a paused workload waits while it starts, and Napwake only pauses and resumes. Scaling under load is for an HPA or KEDA, which it works alongside.',
      'To keep it out of production altogether, label the namespace `napwake.dev/protected: "true"`, or list it in the `protectedNamespaces` Helm value, and Napwake never manages anything there.',
    ],
    sources: [['Opting in: protected namespaces', doc('guides/opt-in')], ['HPA and KEDA', doc('guides/autoscalers')]],
  },
  {
    id: 'public-internet',
    q: 'Is Napwake for environments on the public internet?',
    short: 'Yes, with `napwake.dev/wake: ask`. A browser then gets a Wake it button, so a person wakes it and robots don’t. Tooling, the CLI and the forecast can wake it too.',
    a: [
      'Yes. Set `napwake.dev/wake: ask` on the workload or its namespace, or `defaults.wake: ask` in Helm, and it asks before waking. A browser that reaches it while it’s paused gets a page with a Wake it button, kept out of search engines. Only the click wakes it, and then the usual waking page carries on.',
      'Crawlers, scanners and API calls get a `503` that says how to wake it, and wake nothing. Requests don’t wake it, but other things still do. The forecast (`autoResume`) wakes it before the hours it expects people. A PR bot, a portal, CI or `kubectl napwake wake` can wake it. So can a dependent workload waking, or something scaling it up.',
      'It matters because most requests on the internet are robots, and many present an ordinary browser’s `User-Agent`. Once an environment has its own HTTPS certificate, its hostname is in public certificate logs within minutes, and scanners find it by name. Napwake can’t tell a public URL from a private one. Left on the default, a public one would wake every few minutes.',
      'Behind a VPN, single sign-on or an allowlist, leave it to wake on the first request. If you wake it from a Prometheus activity query, don’t count ingress requests, or filter bots out, since crawlers’ requests count too.',
    ],
    sources: [['Wake on request: the public internet', doc('concepts/wake-on-request')]],
  },
  {
    id: 'savings-without-node-scale-down',
    q: 'Does pausing save money if nodes don’t scale down?',
    short: 'No. Pausing frees what the pods requested. Your bill is for nodes, so it becomes money only once a node autoscaler removes nodes.',
    a: [
      'No. Pausing frees the CPU and memory a workload’s pods requested, but your bill is for nodes, so that becomes money only once a node autoscaler, such as Cluster Autoscaler or Karpenter, removes them. Napwake reports the two apart: freed, and saved, the part that came off the bill.',
      '`kubectl napwake nodes` shows what keeps each node from being removed. Giving non-prod workloads a node pool of their own lets pausing empty whole nodes.',
    ],
    sources: [['Cost tracking', doc('concepts/cost-tracking')], ['Node pools for real savings', doc('guides/node-pools')], ['kubectl plugin: nodes', doc('getting-started/kubectl-plugin')]],
  },
  {
    id: 'try-without-risk',
    q: 'How do I try Napwake without risk?',
    short: 'Run kubectl napwake scan, which installs nothing. Then opt a workload in with dry-run, which measures what Napwake would pause and never pauses it.',
    a: [
      'Scan first, then dry-run. `kubectl napwake scan` reads the cluster with your kubeconfig, installs nothing, and shows what’s idle and what pausing could free, replaying the last week from Prometheus when the cluster has one.',
      'Then install Napwake and opt a workload in with `napwake.dev/dry-run: "true"`. It measures what it would have paused and freed, and never pauses it. It can’t see requests, so a workload used with little CPU looks idler than it is. A Prometheus query on its request rate at the ingress fixes that. `kubectl napwake enable` ends dry-run when you’re ready.',
    ],
    commands: ['kubectl napwake scan', 'kubectl annotate deployment my-api -n dev napwake.dev/dry-run=true', 'kubectl label deployment my-api -n dev napwake.dev/managed=true', 'kubectl napwake enable my-api -n dev'],
    sources: [['kubectl plugin: scan', doc('getting-started/kubectl-plugin')], ['Dry run', doc('guides/dry-run')], ['Quickstart', doc('getting-started/quickstart')]],
  },
  {
    id: 'cost',
    q: 'What does Napwake cost?',
    short: 'Nothing. It’s free and open source under the Apache 2.0 licence. It runs in your own cluster, with one operator replica and two doorman replicas by default.',
    a: [
      'Nothing. It’s free and open source under the Apache 2.0 licence, the operator, the `kubectl napwake` plugin and the Helm chart alike.',
      'It runs in your own cluster. By default that’s one operator replica, requesting 10m of CPU and 128Mi of memory, and two doorman replicas, each requesting 10m and 64Mi.',
    ],
    sources: [['Helm values', doc('reference/helm-values')], ['Apache 2.0', links.apache]],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const html = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
export const plain = (s) => s.replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
export const answerText = (f) => f.a.map(plain).join(' ');
