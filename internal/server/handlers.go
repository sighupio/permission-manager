package server

import (
	"fmt"
	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	"net/http"
	"sighupio/permission-manager/internal/resources"
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

	// Check subject for rolebindings and clusterrolebindings
	roleBindings, err := ac.ResourceManager.RoleBindingList("permission-manager")

	if err != nil {
		return err
	}

	clusterRoleBindings, err := ac.ResourceManager.ClusterRoleBindingList()

	if err != nil {
		return err
	}

	var roleBindingToMigrate *rbacv1.RoleBinding
	var clusterRoleBindingToMigrate *rbacv1.ClusterRoleBinding

	fmt.Println("Searching for roleBinding")

	for _, roleBinding := range (*roleBindings).Items {
		for _, rbSubjects := range roleBinding.Subjects {
			if rbSubjects.Name == r.Username && rbSubjects.Kind == "User" {
				roleBindingToMigrate = &roleBinding
			}
		}
	}

	fmt.Println("Searching for clusterRoleBinding")

	for _, clusterRoleBinding := range (*clusterRoleBindings).Items {
		for _, crbSubjects := range clusterRoleBinding.Subjects {
			if crbSubjects.Name == r.Username && crbSubjects.Kind == "User" {
				clusterRoleBindingToMigrate = &clusterRoleBinding
			}
		}
	}

	if roleBindingToMigrate != nil {

		fmt.Println("roleBinding found")

		err = ac.ResourceManager.RoleBindingDelete(r.Namespace, (*roleBindingToMigrate).Name)

		if err != nil {
			return err
		}

		var subjects []rbacv1.Subject

		subjects = append(subjects, rbacv1.Subject{
			Kind: "ServiceAccount",
			Namespace: "permission-manager",
			Name: r.Username,
		})

		_, err = ac.ResourceManager.RoleBindingCreate(r.Namespace, r.Username, resources.RoleBindingRequirements{
			RoleKind:        (*roleBindingToMigrate).RoleRef.Kind,
			RoleName:        (*roleBindingToMigrate).RoleRef.Name,
			RolebindingName: (*roleBindingToMigrate).Name,
			Subjects:        subjects,
		})

		if err != nil {
			fmt.Println(err)
			return err
		}
	}

	if clusterRoleBindingToMigrate != nil {
		fmt.Println("clusterRoleBinding found")

		err = ac.ResourceManager.ClusterRoleBindingDelete((*clusterRoleBindingToMigrate).Name)

		if err != nil {
			return err
		}

		var subjects []rbacv1.Subject

		subjects = append(subjects, rbacv1.Subject{
			Kind: "ServiceAccount",
			Namespace: "permission-manager",
			Name: r.Username,
		})

		_, err = ac.ResourceManager.ClusterRoleBindingCreate((*clusterRoleBindingToMigrate).Name, r.Username, (*clusterRoleBindingToMigrate).RoleRef.Name, subjects)

		if err != nil {
			return err
		}
	}

	kubeCfg := ac.ResourceManager.ServiceAccountCreateKubeConfigForUser(ac.Config.Cluster, r.Username, r.Namespace)

	return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeCfg})
}
