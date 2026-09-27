package main

import (
	"strings"
	"testing"
)

func TestInjectLoaderBeforeExecutableCode(t *testing.T) {
	content := "// main.js\n\nconst scriptUrls = [\n" + MarkerStart + "\nold loader\n" + MarkerEnd + "\n    \"js/rmmz_core.js\"\n];\n"
	injected := injectLoader(content, false)

	if strings.Index(injected, MarkerStart) > strings.Index(injected, "const scriptUrls") {
		t.Fatal("loader was injected inside the MZ scriptUrls array")
	}
	if strings.Count(injected, MarkerStart) != 1 {
		t.Fatal("existing loader was not replaced")
	}
}
