package resources

import (
	"fmt"
	v1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"log"
	"sighupio/permission-manager/internal/config"
	"time"
)


func (r *Manager) ServiceAccountGet(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Get(r.context, name, metav1.GetOptions{})
}

func (r *Manager) ServiceAccountCreate(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Create(r.context, &v1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
	}, metav1.CreateOptions{})
}

// ServiceAccountCreateKubeConfigForUser Creates a ServiceAccount for the user and returns the KubeConfig with its token
func (r *Manager) ServiceAccountCreateKubeConfigForUser(cluster config.ClusterConfig, username, kubeConfigNamespace string) (kubeconfigYAML string) {

	serviceAccountNamespace := "permission-manager" // TODO: must be received externally to this func?

	// Create service account
	_, err := r.ServiceAccountCreate(serviceAccountNamespace, username)

	if err != nil {
		log.Printf("Service Account not created: %v", err)
	}

	// get service account token
	_, token, err := r.serviceAccountGetToken(serviceAccountNamespace, username, true)

	if err != nil {
		log.Fatal(err)
	}

	certificateTpl := `---
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

	return fmt.Sprintf(certificateTpl,
		username,
		cluster.Name,
		getCaBase64(),
		cluster.ControlPlaneAddress,
		cluster.Name,
		cluster.Name,
		username,
		kubeConfigNamespace,
		username,
		cluster.Name,
		username,
		token,
	)
}



//todo refactor
func (r *Manager) serviceAccountGetToken(ns string, name string, shouldWaitServiceAccountCreation bool) (tokenName string, token string, err error) {

	findToken := func() (bool, error) {
		user, err := r.ServiceAccountGet(ns, name)

		if apierrors.IsNotFound(err) {
			return false, nil
		}

		if err != nil {
			return false, err
		}

		for _, ref := range user.Secrets {

			secret, err := r.SecretGet(ns, ref.Name)

			if apierrors.IsNotFound(err) {
				continue
			}

			if err != nil {
				return false, err
			}

			if secret.Type != v1.SecretTypeServiceAccountToken {
				continue
			}

			name := secret.Annotations[v1.ServiceAccountNameKey]
			uid := secret.Annotations[v1.ServiceAccountUIDKey]
			tokenData := secret.Data[v1.ServiceAccountTokenKey]

			if name == user.Name && uid == string(user.UID) && len(tokenData) > 0 {
				tokenName = secret.Name
				token = string(tokenData)

				return true, nil
			}
		}

		return false, nil
	}

	if shouldWaitServiceAccountCreation {
		err := wait.Poll(time.Second, 10*time.Second, findToken)

		if err != nil {
			return "", "", err
		}
	} else {
		ok, err := findToken()
		if err != nil {
			return "", "", err
		}

		if !ok {
			return "", "", fmt.Errorf("No token found for %s/%s", ns, name)
		}
	}

	return tokenName, token, nil
}



