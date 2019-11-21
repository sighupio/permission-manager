package users

import (
	"encoding/json"
	"log"
	"time"

	"k8s.io/client-go/kubernetes"
)

// User is ab yser saved inside ETCD as a Custom Resouce (CRD api)
type User struct {
	Name string `json:"name"`
}

func GetAll(kc *kubernetes.Clientset) []User {
	users := []User{}

	/* generated from JSON response, most fields not used but usefull as documentation */
	type resType struct {
		APIVersion string `json:"apiVersion"`
		Items      []struct {
			APIVersion string `json:"apiVersion"`
			Kind       string `json:"kind"`
			Metadata   struct {
				Annotations struct {
					KubectlKubernetesIoLastAppliedConfiguration string `json:"kubectl.kubernetes.io/last-applied-configuration"`
				} `json:"annotations"`
				CreationTimestamp time.Time `json:"creationTimestamp"`
				Generation        int       `json:"generation"`
				Name              string    `json:"name"`
				ResourceVersion   string    `json:"resourceVersion"`
				SelfLink          string    `json:"selfLink"`
				UID               string    `json:"uid"`
			} `json:"metadata"`
			Spec struct {
				Name string `json:"name"`
			} `json:"spec"`
		} `json:"items"`
		Kind     string `json:"kind"`
		Metadata struct {
			Continue        string `json:"continue"`
			ResourceVersion string `json:"resourceVersion"`
			SelfLink        string `json:"selfLink"`
		} `json:"metadata"`
	}

	var res resType
	r, err := kc.RESTClient().Get().AbsPath("apis/permissionmanager.user/v1alpha1/permissionmanagerusers").DoRaw()
	if err != nil {
		log.Fatal("Failed to get users from k8s CRUD api", err)
	}
	err = json.Unmarshal(r, &res)
	if err != nil {
		log.Fatal("Failed to decode users from k8s CRUD api", err)
	}

	for _, v := range res.Items {
		users = append(users, User{Name: v.Spec.Name})
	}

	return users
}

func CreateUser(kc *kubernetes.Clientset, username string) User {

	return User{Name: username}
}
