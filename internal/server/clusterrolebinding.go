package server

import (
	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func createClusterRolebinding(c echo.Context) error {
	ac := c.(*AppContext)

	type Request struct {
		ClusterRolebindingName string           `json:"clusterRolebindingName"`
		Username               string           `json:"user"`
		Subjects               []rbacv1.Subject `json:"subjects"`
		RoleName               string           `json:"roleName"`
	}
	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	_, err = ac.ResourceService.ClusterRoleBindingCreate(r.ClusterRolebindingName, r.Username, r.RoleName, r.Subjects)

	if err != nil {
		return err
	}

	return ac.okResponse()
}

func deleteClusterRole(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		RoleName string `json:"roleName" validate:"required"`
	}

	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	err = ac.Kubeclient.RbacV1().ClusterRoles().Delete(c.Request().Context(), r.RoleName, metav1.DeleteOptions{})

	if err != nil {
		return err
	}

	return ac.okResponse()
}

func deleteClusterRolebinding(c echo.Context) error {
	ac := c.(*AppContext)

	type Request struct {
		RolebindingName string `json:"rolebindingName"`
	}

	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	err = ac.ResourceService.ClusterRoleBindingDelete(r.RolebindingName)

	if err != nil {
		return err
	}

	return ac.okResponse()
}
