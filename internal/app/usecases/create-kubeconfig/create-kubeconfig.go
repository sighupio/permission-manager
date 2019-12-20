package createkubeconfigusecase

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
func createKubeconfig(clusterName string, username string, clusterControlPlaceAddress string, caBasebase64 string, crtBase64 string, privateKeyBase64 string) (kubeconfigYAML string) {
	kubeconfigYAML = fmt.Sprintf(`apiVersion: v1
kind: Config
preferences:
    colors: true
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
    name: %s
users:
  - name: %s
    user:
      client-certificate-data: %s
      client-key-data: %s`,
		clusterName, clusterName, clusterControlPlaceAddress, caBasebase64, clusterName, username, clusterName, username, crtBase64, privateKeyBase64)

	return kubeconfigYAML
}
