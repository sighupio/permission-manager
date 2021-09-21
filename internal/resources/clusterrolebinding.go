package resources

import (
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (r *Manager) ClusterRoleBindingList() (*rbacv1.ClusterRoleBindingList, error) {
	return r.kubeclient.RbacV1().ClusterRoleBindings().List(r.context, metav1.ListOptions{})
}

func (r *Manager) ClusterRoleBindingCreate(clusterRoleBindingName, username, roleName string, subjects []rbacv1.Subject) (*rbacv1.ClusterRoleBinding, error) {

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

func (r *Manager) ClusterRoleBindingDelete(roleBindingName string) error {
	return r.kubeclient.RbacV1().ClusterRoleBindings().Delete(r.context, roleBindingName, metav1.DeleteOptions{})
}

func (r *Manager) ClusterRoleBindingLegacyCheck(username string) (clusterRoleBindingToMigrate *rbacv1.ClusterRoleBinding, err error) {
	clusterRoleBindings, err := r.ClusterRoleBindingList()

	if err != nil {
		return nil, err
	}

	for _, clusterRoleBinding := range (*clusterRoleBindings).Items {
		for _, crbSubjects := range clusterRoleBinding.Subjects {
			if crbSubjects.Name == username && crbSubjects.Kind == "User" {
				clusterRoleBindingToMigrate = &clusterRoleBinding
			}
		}
	}

	return clusterRoleBindingToMigrate, nil
}
