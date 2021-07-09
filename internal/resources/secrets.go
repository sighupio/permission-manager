package resources

import (
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type SecretService interface {
	SecretGet(namespace, name string) (*v1.Secret, error)
}

func (r *resourceService) SecretGet(namespace, name string) (*v1.Secret, error) {
	return r.kubeclient.CoreV1().Secrets(namespace).Get(r.context, name, metav1.GetOptions{})
}
