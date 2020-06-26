package kubeconfig

import (
	"context"
	"fmt"

	"k8s.io/client-go/kubernetes"
)

func CreateKubeconfigYAMLForUser(ctx context.Context, kc kubernetes.Interface, clusterName, clusterControlPlaceAddress, username string, namespace string) (kubeconfigYAML string) {
	return createKubeconfig(clusterName, username, namespace, clusterControlPlaceAddress, getCaBase64(), getServiceAccountToken(ctx, kc, username))
}

// CreateKubeconfigYAML returns a kubeconfig YAML string
func createKubeconfig(clusterName, username, namespace, clusterControlPlaceAddress, caBasebase64, token string) (kubeconfigYAML string) {
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
		clusterName,
		caBasebase64,
		clusterControlPlaceAddress,
		clusterName,
		clusterName,
		username,
		namespace,
		username,
		clusterName,
		username,
		token,
	)
}
