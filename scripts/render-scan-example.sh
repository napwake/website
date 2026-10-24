#!/bin/sh
# The home page's scan example: the report and the terminal output for one example cluster, both from the
# product's own code, so every number agrees. The data is the redesigned report's sample (`firstScan()` in
# reports/render/zz_render_samples_test.go, made up); the rename is stood in by text, as reports/render/rename.py does.
#   scripts/render-scan-example.sh          (needs Go; reads the product repo, never writes to it)
set -e
site="$(cd "$(dirname "$0")/.." && pwd)"
reports="${NAPWAKE_REPORTS:-$site/../reports}"
product="${NAPWAKE_PRODUCT:-$HOME/Workspace/experiments/hybernate}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git -C "$product" archive origin/main | tar -x -C "$work"
cp "$reports/report.html" "$reports/statuspage.html" "$reports/render/zz_render_samples_test.go" "$site/scripts/examples/zz_terminal_sample_test.go" "$work/cmd/kubectl-hybernate/"
(cd "$work" && RENDER_DIR="$work/out" go test ./cmd/kubectl-hybernate/ -run TestTerminalSample -count=1 >/dev/null)

rename() { sed -e 's#hybernate\.io/#napwake.dev/#g' -e 's#https://okedeji\.io/hybernate/#https://docs.napwake.dev/#g' \
  -e 's#ghcr\.io/okedeji/charts/hybernate#ghcr.io/napwake/charts/napwake#g' -e 's#Hybernate#Napwake#g' -e 's#hybernate#napwake#g'; }
rename < "$work/out/scan-first.txt" > "$site/src/content/examples/scan-first.txt"
cp "$reports/samples/napwake/scan-first.html" "$site/public/examples/scan-report/index.html"
echo "src/content/examples/scan-first.txt and public/examples/scan-report/index.html from origin/main $(git -C "$product" rev-parse --short origin/main)"
