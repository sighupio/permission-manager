package resources

import (
	"encoding/json"
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
	UserList() ([]User, error)
	UserDelete(username string) error
	UserCreate(username string) (User, error)
}

const resourceURL = "apis/permissionmanager.user/v1alpha1/permissionmanagerusers"

const resourcePrefix = "permissionmanager.user."


// GetAllUsers returns the list of Users defined in the K8s cluster.
func (r *resourceService) UserList() ([]User, error) {
	var users []User

	rawResponse, err := r.kubeclient.AppsV1().RESTClient().Get().AbsPath(resourceURL).DoRaw(r.context)

	if err != nil {
		log.Print("Failed to get users from k8s CRUD api", err)
		return []User{}, err
	}

	// generated from the api-server JSON response, most of the fields are not used but useful as documentation
	var getAllUserResponse struct {
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

	err = json.Unmarshal(rawResponse, &getAllUserResponse)

	if err != nil {
		log.Print("Failed to decode users from k8s CRUD api", err)
		return []User{}, err
	}

	for _, v := range getAllUserResponse.Items {
		users = append(users, User{Name: v.Spec.Name})
	}

	return users, nil
}


// CreateUser adds a new User with the given username to the K8s cluster
// creating a new PermissionManagerUser CRD object. todo add error handling
func (r *resourceService) UserCreate(username string) (User, error) {
	metadataName := resourcePrefix + username

	var createUserRequest = struct {
		APIVersion string `json:"apiVersion"`
		Kind       string `json:"kind"`
		MetaData   struct {
			Name string `json:"name"`
		} `json:"metadata"`
		Spec struct {
			Name string `json:"name"`
		} `json:"spec"`
	}{
		APIVersion: "permissionmanager.user/v1alpha1",
		Kind:       "Permissionmanageruser",
		MetaData: struct {
			Name string `json:"name"`
		}{
			Name: metadataName,
		},
		Spec: struct {
			Name string `json:"name"`
		}{
			Name: username,
		},
	}
	jsonPayload, err := json.Marshal(createUserRequest)

	if err != nil {
		log.Printf("failed to serialize data")
		return User{}, err
	}

	_, err = r.kubeclient.AppsV1().RESTClient().Post().AbsPath(resourceURL).Body([]byte(jsonPayload)).DoRaw(r.context)

	if err != nil {
		log.Printf("Failed to create user:%s\n %v\n", username, err)
		return User{}, err
	}

	return User{Name: username}, nil
}

// DeleteUser delete an existing User from the K8s cluster removing
// the PermissionManagerUser CRD object associated to the user with the given username.
func (r *resourceService) UserDelete(username string) error {
	metadataName := resourcePrefix + username

	_, err := r.kubeclient.AppsV1().RESTClient().Delete().AbsPath(resourceURL + "/" + metadataName).DoRaw(r.context)

	if err == nil {
		return nil
	}

	log.Printf("Failed to delete user:%s\n %v\n", username, err)

	return err
}
