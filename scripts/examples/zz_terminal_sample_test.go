package main

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

// The terminal output for the same example cluster as scan-first.html, from the product's own writer.
func TestTerminalSample(t *testing.T) {
	dir := os.Getenv("RENDER_DIR")
	if dir == "" {
		t.Skip("set RENDER_DIR")
	}
	require.NoError(t, os.MkdirAll(dir, 0o755))
	var out bytes.Buffer
	require.NoError(t, writeTable(&out, firstScan(), 25))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "scan-first.txt"), out.Bytes(), 0o644))
	var page bytes.Buffer
	require.NoError(t, writeHTML(&page, firstScan(), 3600e9))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "scan-first.html"), page.Bytes(), 0o644))
}
