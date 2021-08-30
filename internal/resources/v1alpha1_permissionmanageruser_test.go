package resources

import (
	"testing"
)

/*
need to understand how to test CRD not created sdk

this might help: https://github.com/spotahome/service-level-operator/blob/master/pkg/service/client/kubernetes/fake.go#L14
*/
func TestUserService(t *testing.T) {
	// kc := fake.NewSimpleClientset()
	// svc := NewUserService(kc)
	// assert.Equal(t, svc.GetAll(), []User{})
}
