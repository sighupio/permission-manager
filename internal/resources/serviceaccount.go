package resources

import (
	"fmt"
	v1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"time"
)

type ServiceAccountService interface {
	ServiceAccountGet(namespace, name string) (*v1.ServiceAccount, error)
	ServiceAccountCreate(namespace, name string) (*v1.ServiceAccount, error)
	ServiceAccountGetToken(ns string, name string, shouldWaitSvcCreation bool) (string, string, error)
}

func (r *resourceService) ServiceAccountGet(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Get(r.context, name, metav1.GetOptions{})
}

func (r *resourceService) ServiceAccountCreate(namespace, name string) (*v1.ServiceAccount, error) {
	return r.kubeclient.CoreV1().ServiceAccounts(namespace).Create(r.context, &v1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
	}, metav1.CreateOptions{})
}

//todo refactor
func (r *resourceService) ServiceAccountGetToken(ns string, name string, shouldWait bool) (string, string, error) {
	tokenName := ""
	token := ""

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
