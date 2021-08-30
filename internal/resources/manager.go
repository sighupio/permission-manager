package resources

import (
	"context"
	k8sclient "k8s.io/client-go/kubernetes"
)

// Manager allows to list and manage the life-cycle of the various K8s cluster resources managed by the PermissionManager.
type Manager struct {
	kubeclient                    k8sclient.Interface
	context                       context.Context
	V1Alpha1PermissionManagerUser V1Alpha1PermissionManagerUser
}

// NewManager returns a new instance of a ResourceService
// allowing to interact with a K8s cluster via the given K8s client interface.
func NewManager(kc k8sclient.Interface, ctx context.Context) *Manager {
	return &Manager{
		kubeclient:                    kc,
		context:                       ctx,
		V1Alpha1PermissionManagerUser: V1Alpha1PermissionManagerUser{kubeclient: kc, context: ctx},
	}
}
