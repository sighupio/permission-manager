package resources

import (
	b64 "encoding/base64"
	"fmt"
	"log"
	"sighupio/permission-manager/internal/config"
	"strings"
	"time"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (r *Manager) ServiceAccountGet(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Get(r.context, name, metav1.GetOptions{})
}

// func (r *Manager) ServiceAccountCreateToken(namespace string, tokenRequest *v1.TokenRequest, name string) (*v1.TokenRequest, error) {
// 	return r.kubeclient.CoreV1().ServiceAccounts(namespace).CreateToken(r.context, name, tokenRequest, metav1.CreateOptions{})
// }

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

	var serviceAccount *v1.ServiceAccount = nil
	var accountSecret *v1.Secret = nil
	var err error

	/****  handle service account start ****/
	serviceAccount, err = r.ServiceAccountGet(serviceAccountNamespace, username)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			serviceAccount = nil
		} else {
			log.Printf("Inital get secret failed: %v", err)
		}
	}

	if serviceAccount == nil {
		serviceAccount, err = r.ServiceAccountCreate(serviceAccountNamespace, username)
		time.Sleep(2 * time.Second)
		if err != nil {
			log.Printf("Service Account not created: %v", err)
		}
	}
	/****  handle service account end ****/

	/****  handle service account's secret ****/
	accountSecret, err = r.SecretGet(serviceAccountNamespace, username)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			accountSecret = nil
		} else {
			log.Printf("Inital get secret failed: %v", err)
		}
	}

	// if user delete the secret of the account this will allow generate a new one as well)
	if accountSecret == nil {
		// create secrete for the service account
		var secret = new(v1.Secret)
		secret.SetName(username)
		// ensure the name and the uid match to the account name and account uid, which will be used for authentication by the k8s
		secret.SetAnnotations(map[string]string{
			"kubernetes.io/service-account.name": username,
			"kubernetes.io/service-account.uid":  string(serviceAccount.GetUID()),
		})

		// type kubernetes.io/service-account-token will automatically map the root.ca and create a token to the Data of service account
		secret.Type = "kubernetes.io/service-account-token"
		// create secreat
		_, err = r.SecretCreate(serviceAccountNamespace, secret)

		if err != nil {
			log.Printf("Account Secret not created: %v", err)
		}

		// try 10 times with 0.5 second interval (to wait for k8s fill the data to the newly created Secret)
		for i := 1; i <= 10; i++ {
			accountSecret, err = r.SecretGet(serviceAccountNamespace, username)
			if err != nil {
				log.Printf("Get Secret for account %v failed, : %v", username, err)
				break
			}

			if accountSecret.Data["ca.crt"] != nil {
				break
			}
			time.Sleep(500 * time.Millisecond)
		}
	}
	/****  handle service account's end ****/

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
		b64.StdEncoding.EncodeToString(accountSecret.Data["ca.crt"]),
		cluster.ControlPlaneAddress,
		cluster.Name,
		cluster.Name,
		username,
		kubeConfigNamespace,
		username,
		cluster.Name,
		username,
		accountSecret.Data["token"],
	)
}

//todo refactor
// func (r *Manager) serviceAccountGetToken(ns string, name string, shouldWaitServiceAccountCreation bool) (tokenName string, token string, err error) {

// 	findToken := func() (bool, error) {
// 		user, err := r.ServiceAccountGet(ns, name)

// 		if apierrors.IsNotFound(err) {
// 			return false, nil
// 		}

// 		if err != nil {
// 			return false, err
// 		}

// 		for _, ref := range user.Secrets {

// 			secret, err := r.SecretGet(ns, ref.Name)

// 			if apierrors.IsNotFound(err) {
// 				continue
// 			}

// 			if err != nil {
// 				return false, err
// 			}

// 			if secret.Type != v1.SecretTypeServiceAccountToken {
// 				continue
// 			}

// 			name := secret.Annotations[v1.ServiceAccountNameKey]
// 			uid := secret.Annotations[v1.ServiceAccountUIDKey]
// 			tokenData := secret.Data[v1.ServiceAccountTokenKey]

// 			if name == user.Name && uid == string(user.UID) && len(tokenData) > 0 {
// 				tokenName = secret.Name
// 				token = string(tokenData)

// 				return true, nil
// 			}
// 		}

// 		return false, nil
// 	}

// 	if shouldWaitServiceAccountCreation {
// 		err := wait.Poll(time.Second, 10*time.Second, findToken)

// 		if err != nil {
// 			return "", "", err
// 		}
// 	} else {
// 		ok, err := findToken()
// 		if err != nil {
// 			return "", "", err
// 		}

// 		if !ok {
// 			return "", "", fmt.Errorf("No token found for %s/%s", ns, name)
// 		}
// 	}

// 	return tokenName, token, nil
// }
