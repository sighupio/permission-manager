package kubeconfig

import (
	"encoding/base64"
	"fmt"

	"k8s.io/client-go/kubernetes"
)

func CreateKubeconfigYAMLForUser(kc kubernetes.Interface, clusterName, clusterControlPlaceAddress, username string) (kubeconfigYAML string) {
	priv, privPem := createRsaPrivateKeyPem()
	certificatePemBytes := getSignedCertificateForUser(kc, username, priv)
	crtBase64 := base64.StdEncoding.EncodeToString(certificatePemBytes)
	privateKeyBase64 := base64.StdEncoding.EncodeToString(privPem)

	return createKubeconfig(clusterName, username, clusterControlPlaceAddress, getCaBase64(), crtBase64, privateKeyBase64)
}

// CreateKubeconfigYAML returns a kubeconfig YAML string
func createKubeconfig(clusterName, username, clusterControlPlaceAddress, caBasebase64, crtBase64, privateKeyBase64 string) (kubeconfigYAML string) {
	certificate_tpl := `---
apiVersion: v1
kind: Config
current-context: %s
clusters:
  - name: %s
    cluster:
      server: %s
      certificate-authority-data: %s
contexts:
  - context:
      cluster: %s
      user: %s
    name: %s@%s
users:
  - name: %s
    user:
      client-certificate-data: %s
      client-key-data: %s`


	return fmt.Sprintf(certificate_tpl,
		clusterName,
		clusterName,
		clusterControlPlaceAddress,
		caBasebase64,
		clusterName,
		username,
		username,
		clusterName,
		username,
		crtBase64,
		privateKeyBase64,
	)
}
