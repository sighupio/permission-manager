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

	names, err := ac.ResourceManager.NamespaceList()

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

	clusterRoles, err := ac.ResourceManager.ClusterRoleList()

	if err != nil {
		return err
	}

	clusterRoleBindings, err := ac.ResourceManager.ClusterRoleBindingList()

	if err != nil {
		return err
	}

	roles, err := ac.ResourceManager.RoleList("")

	if err != nil {
		return err
	}

	roleBindings, err := ac.ResourceManager.RoleBindingList("")

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

func checkLegacyUser(c echo.Context) error {
	type Request struct {
		Username string `json:"username"`
		Namespaces []string `json:"namespaces"`
	}

	type Response struct {
		Ok bool `json:"ok"`
		LegacyUserDetected bool `json:"legacyUserDetected"`
	}

	ac := c.(*AppContext)
	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	// if no namespace is set we set the value ["default"]
	if len(r.Namespaces) == 0 {
		r.Namespaces = []string{"default"}
	}

	legacyRoleBindingFound := false

	for _, namespace := range r.Namespaces {
		legacyRoleBinding, err := ac.ResourceManager.RoleBindingLegacyCheck(namespace, r.Username)

		if err != nil {
			return err
		}

		if legacyRoleBinding != nil {
			legacyRoleBindingFound = true
			break
		}
	}

	legacyClusterRoleBinding, err := ac.ResourceManager.ClusterRoleBindingLegacyCheck(r.Username)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, Response{Ok: true, LegacyUserDetected: legacyRoleBindingFound || legacyClusterRoleBinding != nil})
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

	kubeCfg := ac.ResourceManager.ServiceAccountCreateKubeConfigForUser(ac.Config.Cluster, r.Username, r.Namespace)

	return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeCfg})
}
