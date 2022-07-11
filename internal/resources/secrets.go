package resources

import (
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (r *Manager) SecretGet(namespace, name string) (*v1.Secret, error) {
	return r.kubeclient.CoreV1().Secrets(namespace).Get(r.context, name, metav1.GetOptions{})
}

func (r *Manager) SecretCreate(namespace string, secret *v1.Secret) (*v1.Secret, error) {
	return r.kubeclient.CoreV1().Secrets(namespace).Create(r.context, secret, metav1.CreateOptions{})
}
