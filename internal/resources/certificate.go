package resources

import (
	"encoding/base64"
	"io/ioutil"
	"log"
	runtime "sigs.k8s.io/controller-runtime"
)

// getCaBase64 returns the base64 encoding of the Kubernetes cluster api-server CA
func getCaBase64() string {

	kConfig, err := runtime.GetConfig()

	if err != nil {
		log.Fatalf("Unable to get kubeconfig.\n%v", err)
	}

	if len(kConfig.CAData) != 0 {
		return base64.StdEncoding.EncodeToString(kConfig.CAData)
	}

	// CAData len can be 0, so as a fallback we read from CAFile
	CAData, err := ioutil.ReadFile(kConfig.CAFile)
	if err != nil {
		log.Fatalf("Unable to read kubeconfig file.\n%v", err)
	}

	return base64.StdEncoding.EncodeToString(CAData)
}
