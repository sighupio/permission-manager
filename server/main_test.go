package main

import "testing"

func TestMain(t *testing.T) {
	got := "hello"
	want := "world"

	if got != want {
		t.Errorf("got '%v' want '%v'", got, want)
	}
}
	