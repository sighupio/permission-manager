package resources

import (
	"k8s.io/client-go/kubernetes"
)

type ResourcesService interface {
	UserService
	GetNamespaces() (names []string, err error)
}

type resourcesService struct {
	kubeclient kubernetes.Interface
}

func NewResourcesService(kc kubernetes.Interface) ResourcesService {
	return &resourcesService{
		kubeclient: kc,
	}
}
