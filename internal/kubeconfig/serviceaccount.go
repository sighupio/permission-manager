package kubeconfig

import (
	"context"
	"fmt"
	"log"
	"time"

	v1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	clientset "k8s.io/client-go/kubernetes"
)

func getServiceAccountToken(ctx context.Context, c clientset.Interface, name string) (token string) {
	var err error
	ns := "permission-manager" // TODO: must be received externaly to this func

	// Create service account
	_, err = c.CoreV1().ServiceAccounts(ns).Create(ctx, &v1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
	}, metav1.CreateOptions{})

	if err != nil {
		log.Printf("Service Account not created: %v", err)
	}

	// get service account token
	_, token, err = getReferencedServiceAccountToken(c.(*clientset.Clientset), ns, name, true)
	if err != nil {
		log.Fatal(err)
	}

	return token
}

//todo refactor
func getReferencedServiceAccountToken(c *clientset.Clientset, ns string, name string, shouldWait bool) (string, string, error) {
	tokenName := ""
	token := ""

	findToken := func() (bool, error) {
		user, err := c.CoreV1().ServiceAccounts(ns).Get(context.TODO(), name, metav1.GetOptions{})
		if apierrors.IsNotFound(err) {
			return false, nil
		}

		if err != nil {
			return false, err
		}

		for _, ref := range user.Secrets {
			secret, err := c.CoreV1().Secrets(ns).Get(context.TODO(), ref.Name, metav1.GetOptions{})
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

	if shouldWait {
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
