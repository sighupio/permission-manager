package resources

import (
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)


type RoleBindingRequirements struct {
	RoleKind        string
	RoleName        string
	RolebindingName string
	Subjects        []rbacv1.Subject
}


func (r *Manager) RoleBindingCreate(namespace, username string, rbReq RoleBindingRequirements) (*rbacv1.RoleBinding, error) {

	rb, err := r.kubeclient.RbacV1().RoleBindings(namespace).Create(r.context,
		&rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name:      rbReq.RolebindingName,
				Namespace: namespace,
				Labels:    map[string]string{"generated_for_user": username},
			},
			RoleRef: rbacv1.RoleRef{
				Kind:     rbReq.RoleKind,
				Name:     rbReq.RoleName,
				APIGroup: "rbac.authorization.k8s.io",
			},
			Subjects: rbReq.Subjects,
		}, metav1.CreateOptions{})

	if err != nil {
		return nil, err
	}

	return rb, nil

}

func (r *Manager) RoleBindingDelete(namespace, roleBindingName string) error {

	return r.kubeclient.RbacV1().RoleBindings(namespace).Delete(r.context, roleBindingName, metav1.DeleteOptions{})

}

func (r *Manager) RoleBindingList(namespace string) (*rbacv1.RoleBindingList, error) {
	return r.kubeclient.RbacV1().RoleBindings(namespace).List(r.context, metav1.ListOptions{})
}

func (r *Manager) RoleBindingLegacyCheck(namespace string, username string) (roleBindingToMigrate *rbacv1.RoleBinding, err error) {
	roleBindings, err := r.RoleBindingList(namespace)

	if err != nil {
		return nil, err
	}

	for _, roleBinding := range (*roleBindings).Items {
		for _, rbSubjects := range roleBinding.Subjects {
			if rbSubjects.Name == username && rbSubjects.Kind == "User" {
				roleBindingToMigrate = &roleBinding
			}
		}
	}

	return roleBindingToMigrate, nil
}
