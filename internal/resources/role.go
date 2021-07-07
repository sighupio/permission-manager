package resources

import (
	"context"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type RoleService interface {
	DeleteRole(namespace, roleName string, ctx context.Context) error
}

func (r *resourceService) DeleteRole(namespace, roleName string, ctx context.Context) error {
	return r.kubeclient.RbacV1().Roles(namespace).Delete(ctx, roleName, metav1.DeleteOptions{})

}
