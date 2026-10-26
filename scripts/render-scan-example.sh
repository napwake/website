#!/bin/sh
# The home page's scan example: the report and the terminal output for one example cluster, both from the
# product's own code, so every number agrees. The data is the redesigned report's sample (`firstScan()` in
# reports/render/zz_render_samples_test.go, made up); the rename is stood in by text, as reports/render/rename.py does.
#   NAPWAKE_PRODUCT=<checkout> scripts/render-scan-example.sh   (needs Go, and reads the product repo, never writes to it)
set -e
site="$(cd "$(dirname "$0")/.." && pwd)"
reports="${NAPWAKE_REPORTS:-$site/../reports}"
product="${NAPWAKE_PRODUCT:?Set NAPWAKE_PRODUCT to a checkout of github.com/napwake/napwake}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git -C "$product" archive origin/main | tar -x -C "$work"
# The report templates ship in the product now. The samples test is the reports drafts', with the rename applied.
rn() { sed -e 's#github.com/okedeji/hybernate#github.com/napwake/napwake#g' -e 's#https://okedeji.io/hybernate/#https://docs.napwake.dev/#g' -e 's#Hybernate#Napwake#g' -e 's#hybernate\.io/#napwake.dev/#g'; }
rn < "$reports/render/zz_render_samples_test.go" > "$work/cmd/kubectl-napwake/zz_render_samples_test.go"
rn < "$site/scripts/examples/zz_terminal_sample_test.go" > "$work/cmd/kubectl-napwake/zz_terminal_sample_test.go"
(cd "$work" && RENDER_DIR="$work/out" go test ./cmd/kubectl-napwake/ -run 'TestTerminalSample|TestRenderSamples' -count=1 >/dev/null)

rename() { sed -e 's#hybernate\.io/#napwake.dev/#g' -e 's#https://okedeji\.io/hybernate/#https://docs.napwake.dev/#g' \
  -e 's#ghcr\.io/okedeji/charts/hybernate#ghcr.io/napwake/charts/napwake#g' -e 's#Hybernate#Napwake#g' -e 's#hybernate#napwake#g'; }
cp "$work/out/scan-first.txt" "$site/src/content/examples/scan-first.txt"
cp "$work/out/scan-first.html" "$site/public/examples/scan-report/index.html"
echo "src/content/examples/scan-first.txt and public/examples/scan-report/index.html from origin/main $(git -C "$product" rev-parse --short origin/main)"
