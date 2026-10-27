#!/bin/sh
# The home page's scan example: the report and the terminal output for one example cluster, both from the
# product's own code, so every number agrees. The data is the redesigned report's sample (`firstScan()` in
# reports/render/zz_render_samples_test.go, made up); the rename is stood in by text, as reports/render/rename.py does.
#   NAPWAKE_PRODUCT=<checkout> scripts/render-scan-example.sh   (needs Go, and reads the product repo, never writes to it)
#   NAPWAKE_REF=v0.2.0-rc.11 ...                                  from a release's tag instead of origin/main
set -e
site="$(cd "$(dirname "$0")/.." && pwd)"
reports="${NAPWAKE_REPORTS:-$site/../reports}"
product="${NAPWAKE_PRODUCT:?Set NAPWAKE_PRODUCT to a checkout of github.com/napwake/napwake}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

ref="${NAPWAKE_REF:-origin/main}"
git -C "$product" archive "$ref" | tar -x -C "$work"
# The report templates ship in the product now. The samples test is the reports drafts', with the rename applied.
rn() { sed -e 's#github.com/okedeji/hybernate#github.com/napwake/napwake#g' -e 's#https://okedeji.io/hybernate/#https://docs.napwake.dev/#g' -e 's#Hybernate#Napwake#g' -e 's#hybernate\.io/#napwake.dev/#g'; }
# The product has its own liveScan since #109, so the sample's is renamed.
rn < "$reports/render/zz_render_samples_test.go" | sed -e 's#\([^A-Za-z]\)liveScan()#\1sampleLiveScan()#g' -e 's#^// liveScan is#// sampleLiveScan is#' > "$work/cmd/kubectl-napwake/zz_render_samples_test.go"
rn < "$site/scripts/examples/zz_terminal_sample_test.go" > "$work/cmd/kubectl-napwake/zz_terminal_sample_test.go"
# From a release's tag, the plugin knows its version, as the release builds it, so the install step names it.
# A test binary knows package main by its import path, not "main".
ldflags=""
case "$ref" in v*) ldflags="-X github.com/napwake/napwake/cmd/kubectl-napwake.version=$ref" ;; esac
(cd "$work" && RENDER_DIR="$work/out" go test -ldflags "$ldflags" ./cmd/kubectl-napwake/ -run 'TestTerminalSample|TestRenderSamples' -count=1 >/dev/null)

rename() { sed -e 's#hybernate\.io/#napwake.dev/#g' -e 's#https://okedeji\.io/hybernate/#https://docs.napwake.dev/#g' \
  -e 's#ghcr\.io/okedeji/charts/hybernate#ghcr.io/napwake/charts/napwake#g' -e 's#Hybernate#Napwake#g' -e 's#hybernate#napwake#g'; }
cp "$work/out/scan-first.txt" "$site/src/content/examples/scan-first.txt"
cp "$work/out/scan-first.html" "$site/public/examples/scan-report/index.html"
echo "src/content/examples/scan-first.txt and public/examples/scan-report/index.html from $ref $(git -C "$product" rev-parse --short "$ref^{commit}")"
