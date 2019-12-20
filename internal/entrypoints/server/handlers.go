package server

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sighupio/permission-manager/internal/app/resources"
	createKubeconfigUsecase "sighupio/permission-manager/internal/app/usecases/create-kubeconfig"
)

type ErrorRes struct {
	Error string `json:"error"`
}

func listUsers(us resources.UserService) echo.HandlerFunc {
	type response = []resources.User
	return func(c echo.Context) error {
		users := us.GetAllUsers()
		var r response = users
		return c.JSON(http.StatusOK, r)
	}
}
func createUser(us resources.UserService) echo.HandlerFunc {
	return func(c echo.Context) error {
		type request struct {
			Name string `json:"name" validate:"required"`
		}
		type reponse = resources.User
		r := new(request)
		if err := c.Bind(r); err != nil {
			panic(err)
		}
		if err := c.Validate(r); err != nil {
			return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
		}
		if !isValidUsername(r.Name) {
			return c.JSON(http.StatusBadRequest, ErrorRes{invalidUsernameError})
		}

		u := us.CreateUser(r.Name)
		return c.JSON(http.StatusOK, reponse{Name: u.Name})
	}
}

func deleteUser(us resources.UserService) echo.HandlerFunc {
	return func(c echo.Context) error {

		type Request struct {
			Username string `json:"username" validate:"required"`
		}
		type Response struct {
			Ok bool `json:"ok"`
		}

		r := new(Request)
		if err := c.Bind(r); err != nil {
			return err
		}
		if err := c.Validate(r); err != nil {
			return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
		}

		us.DeleteUser(r.Username)
		return c.JSON(http.StatusOK, Response{Ok: true})
	}
}

func ListNamespaces(rs resources.ResourcesService) echo.HandlerFunc {
	return func(c echo.Context) error {
		type Response struct {
			Namespaces []string `json:"namespaces"`
		}

		names, _ := rs.GetNamespaces()
		return c.JSON(http.StatusOK, Response{
			Namespaces: names,
		})
	}
}

func ListRbac(c echo.Context) error {
	ac := c.(*AppContext)
	type Response struct {
		ClusterRoles        []rbacv1.ClusterRole        `json:"clusterRoles"`
		ClusterRoleBindings []rbacv1.ClusterRoleBinding `json:"clusterRoleBindings"`
		Roles               []rbacv1.Role               `json:"roles"`
		RoleBindings        []rbacv1.RoleBinding        `json:"roleBindings"`
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

func CreateClusterRole(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		RoleName string              `json:"roleName" validate:"required"`
		Rules    []rbacv1.PolicyRule `json:"rules" validate:"required"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
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

func CreateRolebinding(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		RolebindingName string           `json:"rolebindingName" validate:"required"`
		Namespace       string           `json:"namespace" validate:"required"`
		Username        string           `json:"generated_for_user" validate:"required"`
		Subjects        []rbacv1.Subject `json:"subjects" validate:"required"`
		RoleKind        string           `json:"roleKind" validate:"required"`
		RoleName        string           `json:"roleName" validate:"required"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
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
	ac := c.(*AppContext)
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
	ac := c.(*AppContext)
	type Request struct {
		RoleName string `json:"roleName" validate:"required"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
	}

	ac.Kubeclient.RbacV1().ClusterRoles().Delete(r.RoleName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteClusterRolebinding(c echo.Context) error {
	ac := c.(*AppContext)
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
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
	}

	ac.Kubeclient.RbacV1().ClusterRoleBindings().Delete(r.RolebindingName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteRole(c echo.Context) error {
	ac := c.(*AppContext)

	type Request struct {
		RoleName  string `json:"roleName" validate:"required"`
		Namespace string `json:"namespace" validate:"required"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
	}

	ac.Kubeclient.RbacV1().Roles(r.Namespace).Delete(r.RoleName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func deleteRolebinding(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		RolebindingName string `json:"rolebindingName" validate:"required"`
		Namespace       string `json:"namespace" validate:"required"`
	}
	type Response struct {
		Ok bool `json:"ok"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
	}

	ac.Kubeclient.RbacV1().RoleBindings(r.Namespace).Delete(r.RolebindingName, nil)
	return c.JSON(http.StatusOK, Response{Ok: true})
}

func createKubeconfig(clusterName, clusterControlPlaceAddress string) echo.HandlerFunc {
	type Request struct {
		Username string `json:"username"`
	}
	type Response struct {
		Ok         bool   `json:"ok"`
		Kubeconfig string `json:"kubeconfig"`
	}
	return func(c echo.Context) error {
		ac := c.(*AppContext)
		r := new(Request)
		if err := c.Bind(r); err != nil {
			return err
		}

		kubeconfig := createKubeconfigUsecase.CreateKubeconfigYAMLForUser(ac.Kubeclient, clusterName, clusterControlPlaceAddress, r.Username)

		return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeconfig})
	}
}

type (
	// FallbackResponseWriter wraps an http.Requesthandler and surpresses
	// a 404 status code. In such case a given local file will be served.
	FallbackResponseWriter struct {
		WrappedResponseWriter http.ResponseWriter
		FileNotFound          bool
	}
)

// Header returns the header of the wrapped response writer
func (frw *FallbackResponseWriter) Header() http.Header {
	return frw.WrappedResponseWriter.Header()
}

// Write sends bytes to wrapped response writer, in case of FileNotFound
// It surpresses further writes (concealing the fact though)
func (frw *FallbackResponseWriter) Write(b []byte) (int, error) {
	if frw.FileNotFound {
		return len(b), nil
	}
	return frw.WrappedResponseWriter.Write(b)
}

// WriteHeader sends statusCode to wrapped response writer
func (frw *FallbackResponseWriter) WriteHeader(statusCode int) {
	if statusCode == http.StatusNotFound {
		frw.FileNotFound = true
		return
	}
	frw.WrappedResponseWriter.WriteHeader(statusCode)
}

func AddFallbackHandler(handler http.HandlerFunc, fs http.FileSystem) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		frw := FallbackResponseWriter{
			WrappedResponseWriter: w,
			FileNotFound:          false,
		}
		handler(&frw, r)
		if frw.FileNotFound {
			f, err := fs.Open("/index.html")
			if err != nil {
				log.Fatal("Failed to open index.html")
			}
			defer f.Close()
			content, err := ioutil.ReadAll(f)
			if err != nil {
				log.Fatal("Failed to read index.html")
			}

			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprint(w, string(content))
		}
	}
}
