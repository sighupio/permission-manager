package resources

import (
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ClusterRoleService interface {
	ClusterRoleCreate(roleName string, rules []rbacv1.PolicyRule) (*rbacv1.ClusterRole, error)
	ClusterRoleDelete(roleName string) error
	ClusterRoleList() (*rbacv1.ClusterRoleList, error)
}

func (r *resourceService) ClusterRoleCreate(roleName string, rules []rbacv1.PolicyRule) (*rbacv1.ClusterRole, error) {
	return r.kubeclient.RbacV1().ClusterRoles().Create(r.context, &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: roleName,
		},
		Rules: rules,
	}, metav1.CreateOptions{})

}

func (r *resourceService) ClusterRoleDelete(roleName string) error {
	return r.kubeclient.RbacV1().ClusterRoles().Delete(r.context, roleName, metav1.DeleteOptions{})
}

func (r *resourceService) ClusterRoleList() (*rbacv1.ClusterRoleList, error) {
	return r.kubeclient.RbacV1().ClusterRoles().List(r.context, metav1.ListOptions{})
}
