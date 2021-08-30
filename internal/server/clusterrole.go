package server

import (
	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
)

func createClusterRole(c echo.Context) error {
	type Request struct {
		RoleName string              `json:"roleName" validate:"required"`
		Rules    []rbacv1.PolicyRule `json:"rules" validate:"required"`
	}
	ac := c.(*AppContext)

	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	_, err = ac.ResourceManager.ClusterRoleCreate(r.RoleName, r.Rules)

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

	err = ac.ResourceManager.ClusterRoleDelete(r.RoleName)

	if err != nil {
		return err
	}

	return ac.okResponse()
}
