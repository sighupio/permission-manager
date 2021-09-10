package resources

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetAllNamespaces lists all the Namespaces available in the K8s cluster.
func (r *Manager) NamespaceList() (names []string, err error) {
	namespaces, err := r.kubeclient.CoreV1().Namespaces().List(r.context, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, ns := range namespaces.Items {
		names = append(names, ns.Name)
	}

	return names, nil
}
