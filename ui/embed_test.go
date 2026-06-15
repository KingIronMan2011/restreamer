package ui

import "testing"

func TestEmbeddedUIContainsIndex(t *testing.T) {
	f, err := FS.Open("build/index.html")
	if err != nil {
		t.Fatalf("embedded UI is missing build/index.html: %v", err)
	}
	f.Close()
}
