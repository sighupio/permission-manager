package resources

import (
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ClusterRoleBindingService interface {
	CreateClusterRoleBinding(cr *rbacv1.ClusterRoleBinding) (*rbacv1.ClusterRoleBinding, error)
}

func (r *resourceService) CreateClusterRoleBinding(cr *rbacv1.ClusterRoleBinding) (*rbacv1.ClusterRoleBinding, error) {

	return r.kubeclient.RbacV1().ClusterRoleBindings().Create(r.context, cr, metav1.CreateOptions{})
}
