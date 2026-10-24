---
title: Introducing Napwake
date: 2026-10-23
description: A placeholder for the launch post, written in the writing stage. Everything below is true today.
author: Tobi Okedeji
draft: true
---

Napwake pauses idle Kubernetes workloads in staging, preview and dev, and wakes them on the first request. It never deletes a workload or its data.

It's open source under the Apache 2.0 licence: an operator, a `kubectl napwake` plugin and a Helm chart. Version 0.2.0 is in release candidates.

To see what's idle in a cluster before installing anything:

```
kubectl napwake scan
```

It reads the cluster with your kubeconfig and installs nothing.

Until the real post: [how it works](/how-it-works/), [the FAQ](/faq/), and [the changelog](/changelog/).
