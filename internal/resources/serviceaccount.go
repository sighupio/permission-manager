package resources

import (
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ServiceAccountService interface {
	ServiceAccountGet(namespace, name string) (*v1.ServiceAccount, error)
	ServiceAccountCreate(namespace, name string) (*v1.ServiceAccount, error)
}

func (r *resourceService) ServiceAccountGet(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Get(r.context, name, metav1.GetOptions{})
}

func (r *resourceService) ServiceAccountCreate(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Create(r.context, &v1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
	}, metav1.CreateOptions{})
}
