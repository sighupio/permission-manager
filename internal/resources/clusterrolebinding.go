package resources

import (
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ClusterRoleBindingService interface {
	ClusterRoleBindingCreate(clusterRoleBindingName, username, roleName string, subjects []rbacv1.Subject) (*rbacv1.ClusterRoleBinding, error)
	ClusterRoleBindingDelete(roleBindingName string) error
	ClusterRoleBindingList() (*rbacv1.ClusterRoleBindingList, error)
}

func (r *resourceService) ClusterRoleBindingList() (*rbacv1.ClusterRoleBindingList, error) {
	return r.kubeclient.RbacV1().ClusterRoleBindings().List(r.context, metav1.ListOptions{})
}

func (r *resourceService) ClusterRoleBindingCreate(clusterRoleBindingName, username, roleName string, subjects []rbacv1.Subject) (*rbacv1.ClusterRoleBinding, error) {

	return r.kubeclient.RbacV1().ClusterRoleBindings().Create(r.context,
		&rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name:   clusterRoleBindingName,
				Labels: map[string]string{"generated_for_user": username},
			},
			RoleRef: rbacv1.RoleRef{
				Kind:     "ClusterRole",
				Name:     roleName,
				APIGroup: "rbac.authorization.k8s.io",
			},
			Subjects: subjects,
		}, metav1.CreateOptions{})
}

func (r *resourceService) ClusterRoleBindingDelete(roleBindingName string) error {
	return r.kubeclient.RbacV1().ClusterRoleBindings().Delete(r.context, roleBindingName, metav1.DeleteOptions{})
}
