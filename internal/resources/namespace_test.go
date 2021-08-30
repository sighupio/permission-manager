package resources

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestListNamespaces(t *testing.T) {
	kc := NewFakeKubeClient()
	ctx := context.Background()

	svc := NewManager(kc, ctx)

	names, err := svc.NamespaceList()

	got := names
	want := []string{}
	if assert.NoError(t, err) {
		assert.ElementsMatch(t, want, got)
	}

	// svc.UserCreate("jaga")
	// svc.UserCreate("jacopo")

	// names, err = svc.GetNamespaces()
	// got = names
	// want = []string{"jaga", "jacopo"}
	// if assert.NoError(t, err) {
	// assert.ElementsMatch(t, want, got)
	// }
}
