package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/sighupio/permission-manager/kube"

	v1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// AppContext echo context extended with application specific fields
type AppContext struct {
	echo.Context
	Kubeclient *kubernetes.Clientset
}

func main() {
	e := echo.New()

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			customContext := &AppContext{Context: c, Kubeclient: kube.NewKubeclient()}
			return next(customContext)
		}
	})

	// e.Use(middleware.Logger())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method}, uri=${uri}, status=${status}\n",
	}))

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})

	e.GET("/api/list-users", listUsers)
	e.GET("/api/list-groups", listGroups)
	e.GET("/api/list-namespace", listNamespaces)
	e.GET("/api/rbac", listRbac)

	e.POST("/api/create-cluster-role", createClusterRole)
	e.POST("/api/create-user", createUser)
	e.POST("/api/create-rolebinding", createRolebinding)
	e.POST("/api/create-cluster-rolebinding", createClusterRolebinding)

	e.POST("/api/delete-cluster-role", deleteClusterRole)
	e.POST("/api/delete-cluster-rolebinding", deleteClusterRolebinding)
	e.POST("/api/delete-rolebinding", deleteRolebinding)
	e.POST("/api/delete-role", deleteRole)

	e.POST("/api/create-kubeconfig", createKubeconfig)

	e.Logger.Fatal(e.Start(":4000"))
}

type user struct {
	Name string `json:"name"`
}

var users []user

func listUsers(c echo.Context) error {
	return c.JSON(http.StatusOK, []user{
		user{Name: "popo"},
	})
}

func createUser(c echo.Context) error {
	type Request struct {
		Name string `json:"name"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		panic(err)
	}

	users = append(users, user{Name: r.Name})

	return c.JSON(http.StatusOK, r)
}

func listGroups(c echo.Context) error {
	type Group struct {
		Name string `json:"name"`
	}
	return c.JSON(http.StatusOK, []Group{})
}

func listNamespaces(c echo.Context) error {
	ac := c.(AppContext)

	namespaces, err := ac.Kubeclient.CoreV1().Namespaces().List(metav1.ListOptions{})
	if err != nil {
		panic(err.Error())
	}

	type Response struct {
		Namespaces []v1.Namespace `json:"namespaces"`
	}

	return c.JSON(http.StatusOK, Response{
		Namespaces: namespaces.Items,
	})
}

func listRbac(c echo.Context) error {
	ac := c.(AppContext)
	type Response struct {
		ClusterRoles        []rbacv1.ClusterRole        `json:"clusterRoles"`
		ClusterRoleBindings []rbacv1.ClusterRoleBinding `json:"clusterRoleBindings"`
		Roles               []rbacv1.Role               `json:"roles"`
		RoleBindings        []rbacv1.RoleBinding        `json:"roleBindinds"`
	}

	clusterRoles, err := ac.Kubeclient.RbacV1().ClusterRoles().List(metav1.ListOptions{})
	if err != nil {
		panic(err.Error())
	}

	clusterRoleBindings, err := ac.Kubeclient.RbacV1().ClusterRoleBindings().List(metav1.ListOptions{})
	if err != nil {
		panic(err.Error())
	}

	roles, err := ac.Kubeclient.RbacV1().Roles("").List(metav1.ListOptions{})
	if err != nil {
		panic(err.Error())
	}

	roleBindings, err := ac.Kubeclient.RbacV1().RoleBindings("").List(metav1.ListOptions{})
	if err != nil {
		panic(err.Error())
	}

	return c.JSON(http.StatusOK, Response{
		ClusterRoles:        clusterRoles.Items,
		ClusterRoleBindings: clusterRoleBindings.Items,
		Roles:               roles.Items,
		RoleBindings:        roleBindings.Items,
	})
}

func createClusterRole(c echo.Context) error {
	ac := c.(AppContext)
	type Request struct {
		RoleName string              `json:"roleName"`
		Rules    []rbacv1.PolicyRule `json:"rules"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	type Response struct {
		Ok bool `json:"ok"`
	}

	ac.Kubeclient.RbacV1().ClusterRoles().Create(&rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: r.RoleName,
		},
		Rules: r.Rules,
	})

	return c.JSON(http.StatusOK, Response{Ok: true})
}

func createRolebinding(c echo.Context) error {
	ac := c.(AppContext)
	type Request struct {
		RolebindingName string           `json:"rolebindingName"`
		Namespace       string           `json:"namespace"`
		Username        string           `json:"user"`
		Subjects        []rbacv1.Subject `json:"subjects"`
		RoleKind        string           `json:"roleKind"`
		RoleName        string           `json:"roleName"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	type Response struct {
		Ok bool `json:"ok"`
	}

	ac.Kubeclient.RbacV1().RoleBindings(r.Namespace).Create(&rbacv1.RoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:      r.RolebindingName,
			Namespace: r.Namespace,
			Labels:    map[string]string{"generated_for_user": r.Username},
		},
		RoleRef: rbacv1.RoleRef{
			Kind:     r.RoleKind,
			Name:     r.RoleName,
			APIGroup: "rbac.authorization.k8s.io",
		},
		Subjects: r.Subjects,
	})

	return c.JSON(http.StatusOK, Response{Ok: true})
}

func createClusterRolebinding(c echo.Context) error {
	ac := c.(AppContext)
	type Request struct {
		ClusterRolebindingName string           `json:"clusterRolebindingName"`
		Username               string           `json:"user"`
		Subjects               []rbacv1.Subject `json:"subjects"`
		RoleName               string           `json:"roleName"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	type Response struct {
		Ok bool `json:"ok"`
	}

	ac.Kubeclient.RbacV1().ClusterRoleBindings().Create(&rbacv1.ClusterRoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:   r.ClusterRolebindingName,
			Labels: map[string]string{"generated_for_user": r.Username},
		},
		RoleRef: rbacv1.RoleRef{
			Kind:     "ClusterRole",
			Name:     r.RoleName,
			APIGroup: "rbac.authorization.k8s.io",
		},
		Subjects: r.Subjects,
	})

	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteClusterRole(c echo.Context) error {
	ac := c.(AppContext)
	type Request struct {
		RoleName string `json:"roleName"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	ac.Kubeclient.RbacV1().ClusterRoles().Delete(r.RoleName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteClusterRolebinding(c echo.Context) error {
	ac := c.(AppContext)
	type Request struct {
		RolebindingName string `json:"rolebindingName"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	ac.Kubeclient.RbacV1().ClusterRoleBindings().Delete(r.RolebindingName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteRole(c echo.Context) error {
	ac := c.(AppContext)

	type Request struct {
		RoleName  string `json:"roleName"`
		Namespace string `json:"namespace"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	ac.Kubeclient.RbacV1().Roles(r.Namespace).Delete(r.RoleName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteRolebinding(c echo.Context) error {
	ac := c.(AppContext)
	type Request struct {
		RolebindingName string `json:"rolebindingName"`
		Namespace       string `json:"namespace"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	ac.Kubeclient.RbacV1().RoleBindings(r.Namespace).Delete(r.RolebindingName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func createKubeconfig(c echo.Context) error {
	type Request struct {
		Username string `json:"username"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	kubeconfig := kube.CreateKubeconfigYAML(r.Username)

	type Response struct {
		Ok         bool   `json:"ok"`
		Kubeconfig string `json:"kubeconfig"`
	}
	return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeconfig})
}
