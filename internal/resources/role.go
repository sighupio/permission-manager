package resources

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type RoleService interface {
	RoleDelete(namespace, roleName string) error
}

func (r *resourceService) RoleDelete(namespace, roleName string) error {
	return r.kubeclient.RbacV1().Roles(namespace).Delete(r.context, roleName, metav1.DeleteOptions{})

}
