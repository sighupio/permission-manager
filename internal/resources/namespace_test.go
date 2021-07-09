package resources

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/client-go/kubernetes/fake"
)

func TestListNamespaces(t *testing.T) {
	kc := fake.NewSimpleClientset()
	ctx := context.Background()

	svc := NewResourcesService(kc, ctx)

	names, err := svc.NamespaceGetAll()

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
