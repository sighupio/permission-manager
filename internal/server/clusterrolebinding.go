package server

import (
	"github.com/labstack/echo/v4"
	rbacv1 "k8s.io/api/rbac/v1"
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

	// This is only a workaround: https://github.com/sighupio/permission-manager/issues/140
	var subjs []rbacv1.Subject
	for _, s := range r.Subjects {
		s.Namespace = ac.Config.Cluster.Namespace
		subjs = append(subjs, s)
	}

	_, err = ac.ResourceManager.ClusterRoleBindingCreate(r.ClusterRolebindingName, r.Username, r.RoleName, subjs)

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

	err = ac.ResourceManager.ClusterRoleBindingDelete(r.RolebindingName)

	if err != nil {
		return err
	}

	return ac.okResponse()
}
