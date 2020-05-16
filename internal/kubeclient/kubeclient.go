package kubeclient

import (
	"log"
	"os"

	"k8s.io/client-go/kubernetes"
	runtime "sigs.k8s.io/controller-runtime"
)

// New returns a kubernetes client already configured
func New() kubernetes.Interface {
	config, err := runtime.GetConfig()
	if err != nil {
		log.Printf("Unable to get kubeconfig.\n%v", err)
		os.Exit(1)
	}

	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Printf("Unable to create a Kubernetes client from the kubeconfig.\n%v", err)
		os.Exit(1)
	}

	return client
}
