package resources

import (
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	"log"
	runtime "sigs.k8s.io/controller-runtime"
)

// NewKubeClient returns a kubernetes client already configured
func NewKubeClient() kubernetes.Interface {
	config, err := runtime.GetConfig()

	if err != nil {
		log.Fatalf("Unable to get kubeconfig.\n%v", err)
	}

	client, err := kubernetes.NewForConfig(config)

	if err != nil {
		log.Fatalf("Unable to create a Kubernetes client from the kubeconfig.\n%v", err)
	}

	return client
}

func NewFakeKubeClient() kubernetes.Interface {
	return fake.NewSimpleClientset()
}
