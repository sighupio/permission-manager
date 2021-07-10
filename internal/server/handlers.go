package server

import (
	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	"net/http"
)


func ListNamespaces(c echo.Context) error {
	ac := c.(*AppContext)

	type Response struct {
		Namespaces []string `json:"namespaces"`
	}

	names, err := ac.ResourceService.NamespaceList()

	if err != nil {
		return err
	}

	return ac.okResponseWithData(Response{
		Namespaces: names,
	})
}

func listRbac(c echo.Context) error {
	ac := c.(*AppContext)
	type Response struct {
		ClusterRoles        []rbacv1.ClusterRole        `json:"clusterRoles"`
		ClusterRoleBindings []rbacv1.ClusterRoleBinding `json:"clusterRoleBindings"`
		Roles               []rbacv1.Role               `json:"roles"`
		RoleBindings        []rbacv1.RoleBinding        `json:"roleBindings"`
	}

	clusterRoles, err := ac.ResourceService.ClusterRoleList()

	if err != nil {
		return err
	}

	clusterRoleBindings, err := ac.ResourceService.ClusterRoleBindingList()

	if err != nil {
		return err
	}

	roles, err := ac.ResourceService.RoleList("")

	if err != nil {
		return err
	}

	roleBindings, err := ac.ResourceService.RoleBindingList("")

	if err != nil {
		return err
	}

	return ac.okResponseWithData(Response{
		ClusterRoles:        clusterRoles.Items,
		ClusterRoleBindings: clusterRoleBindings.Items,
		Roles:               roles.Items,
		RoleBindings:        roleBindings.Items,
	})

}

func createKubeconfig(c echo.Context) error {
	type Request struct {
		Username  string `json:"username"`
		Namespace string `json:"namespace"`
	}
	type Response struct {
		Ok         bool   `json:"ok"`
		Kubeconfig string `json:"kubeconfig"`
	}

	ac := c.(*AppContext)
	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}
	// if no namespace is set we set the value "default"
	if r.Namespace == "" {
		r.Namespace = "default"
	}

	kubeCfg := ac.ResourceService.ServiceAccountCreateKubeConfigForUser(ac.Config.Cluster, r.Username, r.Namespace)

	return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeCfg})
}

