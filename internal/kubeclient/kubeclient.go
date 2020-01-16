package kubeclient

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func newRestConfig() *rest.Config {
	var kubeconfig *string

	if home := os.Getenv("HOME"); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()
	fmt.Printf("kubeconfig path: %s\n", *kubeconfig)

	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
	if err != nil {
		panic(err.Error())
	}

	return config
}

// New returns a kubernetes client already configured
func New() kubernetes.Interface {
	var config *rest.Config
	if os.Getenv("KUBERNETES_SERVICE_HOST") != "" {
		c, err := rest.InClusterConfig()
		if err != nil {
			panic(err.Error())
		}
		config = c
	} else {
		config = newRestConfig()
	}

	client, err := kubernetes.NewForConfig(config)
	// kubeclient, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	return client
}
