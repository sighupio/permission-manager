package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

const (
	ResourceURL    = "apis/permissionmanager.user/v1alpha1/permissionmanagerusers"
	ResourcePrefix = "permissionmanagerusers.permissionmanager.user."
)

type PermissionManagerUserSpec struct {
	Name string `json:"name"`
}

// PermissionManagerUser is the PermissionManager representation of an user of the managed K8s cluster
type PermissionManagerUser struct {
	metav1.TypeMeta `json:",inline"`
	Metadata        metav1.ObjectMeta         `json:"metadata,omitempty"`
	Spec            PermissionManagerUserSpec `json:"spec"`
}

type PermissionManagerUserList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []PermissionManagerUser `json:"items"`
}
