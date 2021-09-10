package resources

import (
	"context"
	"encoding/json"
	"log"
	"sighupio/permission-manager/internal/crd/v1alpha1"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8sclient "k8s.io/client-go/kubernetes"
)

type V1Alpha1PermissionManagerUser struct {
	kubeclient k8sclient.Interface
	context    context.Context
}

// User is the API exposed data of a PermissionManagerUser resource. TODO deprecate.
type User struct {
	Name string `json:"name"`
}

// List returns the list of Users defined in the K8s cluster.
func (r *V1Alpha1PermissionManagerUser) List() ([]User, error) {
	//noinspection GoPreferNilSlice
	users := []User{}

	rawResponse, err := r.kubeclient.Discovery().RESTClient().Get().AbsPath(v1alpha1.ResourceURL).DoRaw(r.context)

	if err != nil {
		log.Print("Failed to get users from k8s CRUD api", err)
		return []User{}, err
	}

	// generated from the api-server JSON response, most of the fields are not used but useful as documentation
	var getAllUserResponse v1alpha1.PermissionManagerUserList
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

// Create adds a new User with the given username to the K8s cluster
// creating a new PermissionManagerUser CRD object. todo add error handling
func (r *V1Alpha1PermissionManagerUser) Create(username string) (User, error) {
	metadataName := v1alpha1.ResourcePrefix + username

	createUserRequest := v1alpha1.PermissionManagerUser{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "permissionmanager.user/v1alpha1",
			Kind:       "Permissionmanageruser",
		},
		Metadata: metav1.ObjectMeta{
			Name: metadataName,
		},
		Spec: v1alpha1.PermissionManagerUserSpec{
			Name: username,
		},
	}
	jsonPayload, err := json.Marshal(createUserRequest)

	if err != nil {
		log.Printf("failed to serialize data")
		return User{}, err
	}

	_, err = r.kubeclient.Discovery().RESTClient().Post().AbsPath(v1alpha1.ResourceURL).Body(jsonPayload).DoRaw(r.context)

	if err != nil {
		log.Printf("Failed to create PermissionManagerUser:%s\n %v\n", username, err)
		return User{}, err
	}

	return User{Name: username}, nil
}

// Delete delete an existing User from the K8s cluster removing
// the PermissionManagerUser CRD object associated to the PermissionManagerUser with the given username.
func (r *V1Alpha1PermissionManagerUser) Delete(username string) error {
	metadataName := v1alpha1.ResourcePrefix + username

	_, err := r.kubeclient.Discovery().RESTClient().Delete().AbsPath(v1alpha1.ResourceURL + "/" + metadataName).DoRaw(r.context)

	if err == nil {
		return nil
	}

	log.Printf("Failed to delete PermissionManagerUser:%s\n %v\n", username, err)

	return err
}
