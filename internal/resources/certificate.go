package resources

import (
	"encoding/base64"
	"log"
	runtime "sigs.k8s.io/controller-runtime"
)

// getCaBase64 returns the base64 encoding of the Kubernetes cluster api-server CA
func getCaBase64() string {

	kConfig, err := runtime.GetConfig()

	if err != nil {
		log.Fatalf("Unable to get kubeconfig.\n%v", err)
	}

	return base64.StdEncoding.EncodeToString(kConfig.CAData)

}
