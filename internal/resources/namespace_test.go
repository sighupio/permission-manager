package resources

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/client-go/kubernetes/fake"
)

func TestGetNamespaces(t *testing.T) {
	kc := fake.NewSimpleClientset()
	svc := NewResourcesService(kc)

	names, err := svc.GetNamespaces()
	got := names
	want := []string{}
	if assert.NoError(t, err) {
		assert.ElementsMatch(t, want, got)
	}


	// svc.CreateUser("jaga")
	// svc.CreateUser("jacopo")

	// names, err = svc.GetNamespaces()
	// got = names
	// want = []string{"jaga", "jacopo"}
	// if assert.NoError(t, err) {
	// assert.ElementsMatch(t, want, got)
	// }
}
