package resources

import (
	"context"

	k8sclient "k8s.io/client-go/kubernetes"
)

// ResourceService allows to list and manage the life-cycle of the various K8s cluster resources managed by the PermissionManager.
type ResourceService interface {
	UserService
	RoleBindingService
	RoleService
	ClusterRoleBindingService
	ClusterRoleService
	ServiceAccountService
	SecretService
	NamespaceList() (names []string, err error)
}

// resourceService implements the ResourceService interface.
type resourceService struct {
	kubeclient k8sclient.Interface
	context    context.Context
}

// NewResourcesService returns a new instance of a ResourceService
// allowing to interact with a K8s cluster via the given K8s client interface.
func NewResourceService(kc k8sclient.Interface, ctx context.Context) ResourceService {
	return &resourceService{
		kubeclient: kc,
		context:    ctx,
	}
}
