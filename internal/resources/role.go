package resources

import (
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (r *Manager) RoleList(namespace string) (*rbacv1.RoleList, error) {
	return r.kubeclient.RbacV1().Roles(namespace).List(r.context, metav1.ListOptions{})
}
func (r *Manager) RoleDelete(namespace, roleName string) error {
	return r.kubeclient.RbacV1().Roles(namespace).Delete(r.context, roleName, metav1.DeleteOptions{})

}
