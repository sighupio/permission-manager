package resources

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// User is the PermissionManager representation
// of users of the managed K8s cluster.
type User struct {
	Name string `json:"name"`
}

// UserService allows to manage the life-cycle of
// Users defined in the managed K8s cluster.
type UserService interface {
	GetAllUsers(cxt context.Context) []User
	DeleteUser(cxt context.Context, username string)
	CreateUser(cxt context.Context, username string) User
}

const resourceURL = "apis/permissionmanager.user/v1alpha1/permissionmanagerusers"

// GetAllUsers returns the list of Users defined in the K8s cluster.
func (r *resourcesService) GetAllUsers(ctx context.Context) []User {
	users := []User{}

	// generated from the api-server JSON response, most of the fields are not used but useful as documentation
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
	rawResponse, err := r.kubeclient.AppsV1().RESTClient().Get().AbsPath(resourceURL).DoRaw(ctx)
	if err != nil {
		log.Print("Failed to get users from k8s CRUD api", err)
	}
	err = json.Unmarshal(rawResponse, &res)
	if err != nil {
		log.Print("Failed to decode users from k8s CRUD api", err)
	}

	for _, v := range res.Items {
		users = append(users, User{Name: v.Spec.Name})
	}

	return users
}

// CreateUser adds a new User with the given username to the K8s cluster
// creating a new PermissionManagerUser CRD object.
func (r *resourcesService) CreateUser(ctx context.Context, username string) User {
	metadataName := "permissionmanager.user." + username
	jsonPayload := fmt.Sprintf(`{
		"apiVersion":"permissionmanager.user/v1alpha1",
		"kind":"Permissionmanageruser",
		"metadata":{
			"name": "%s"
		},
		"spec": {
			"name": "%s"
		}
	}`, metadataName, username)

	_, err := r.kubeclient.AppsV1().RESTClient().Post().AbsPath(resourceURL).Body([]byte(jsonPayload)).DoRaw(ctx)
	if err != nil {
		log.Printf("Failed to create user:%s\n %v\n", username, err)
	}

	return User{Name: username}
}

// DeleteUser delete an existing User from the K8s cluster removing
// the PermissionManagerUser CRD object associated to the user with the given username.
func (r *resourcesService) DeleteUser(ctx context.Context, username string) {
	metadataName := "permissionmanager.user." + username

	_, err := r.kubeclient.AppsV1().RESTClient().Delete().AbsPath(resourceURL + "/" + metadataName).DoRaw(ctx)

	if err != nil {
		log.Printf("Failed to delete user:%s\n %v\n", username, err)
	}
}
