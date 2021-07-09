package kubeconfig

import (
	"encoding/base64"
	"fmt"
	"log"
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/resources"
	runtime "sigs.k8s.io/controller-runtime"
)

// CreateKubeConfigYAML returns a kubeconfig YAML string
func CreateKubeConfigYAMLForUser(rs resources.ResourceService, cluster config.ClusterConfig, username, namespace string) (kubeconfigYAML string) {
	caBase64 := getCaBase64()
	token := getServiceAccountToken(rs, username)

	certificate_tpl := `---
apiVersion: v1
kind: Config
current-context: %s@%s
clusters:
  - cluster:
      certificate-authority-data: %s
      server: %s
    name: %s
contexts:
  - context:
      cluster: %s
      user: %s
      namespace: %s
    name: %s@%s
users:
  - name: %s
    user:
      token: %s`

	return fmt.Sprintf(certificate_tpl,
		username,
		cluster.Name,
		caBase64,
		cluster.ControlPlaneAddress,
		cluster.Name,
		cluster.Name,
		username,
		namespace,
		username,
		cluster.Name,
		username,
		token,
	)
}



// getCaBase64 returns the base64 encoding of the Kubernetes cluster api-server CA
func getCaBase64() string {

	kConfig, err := runtime.GetConfig()

	if err != nil {
		log.Fatalf("Unable to get kubeconfig.\n%v", err)
	}

	return base64.StdEncoding.EncodeToString(kConfig.CAData)

}
