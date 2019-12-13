package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/go-playground/validator"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/sighupio/permission-manager/kube"
	"github.com/sighupio/permission-manager/users"

	"github.com/rakyll/statik/fs"
	_ "github.com/sighupio/permission-manager/statik"
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

type CustomValidator struct {
	validator *validator.Validate
}

type ErrorRes struct {
	Error string `json:"error"`
}

/* how to improve error messages */
/* https://medium.com/@apzuk3/input-validation-in-golang-bc24cdec1835 */
func (cv *CustomValidator) Validate(i interface{}) error {
	return cv.validator.Struct(i)
}

func main() {
	e := echo.New()

	basicAuthPassword := os.Getenv("BASIC_AUTH_PASSWORD")
	if basicAuthPassword == "" {
		log.Fatal("BASIC_AUTH_PASSWORD env cannot be empty")
	}

	e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
		if username == "admin" && password == basicAuthPassword {
			return true, nil
		}
		return false, nil
	}))

	e.Validator = &CustomValidator{validator: validator.New()}

	kc := kube.NewKubeclient()
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			customContext := &AppContext{Context: c, Kubeclient: kc}
			return next(customContext)
		}
	})

	// e.Use(middleware.Logger())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method}, uri=${uri}, status=${status}\n",
	}))

	api := e.Group("/api")

	api.GET("/list-users", listUsers)
	api.GET("/list-groups", listGroups)
	api.GET("/list-namespace", listNamespaces)
	api.GET("/rbac", listRbac)

	api.POST("/create-cluster-role", createClusterRole)
	api.POST("/create-user", createUser)
	api.POST("/create-rolebinding", createRolebinding)
	api.POST("/create-cluster-rolebinding", createClusterRolebinding)

	api.POST("/delete-cluster-role", deleteClusterRole)
	api.POST("/delete-cluster-rolebinding", deleteClusterRolebinding)
	api.POST("/delete-rolebinding", deleteRolebinding)
	api.POST("/delete-role", deleteRole)

	api.POST("/create-kubeconfig", createKubeconfig)

	statikFS, err := fs.New()
	if err != nil {
		e.Logger.Fatal(err)
	}

	spaHandler := http.FileServer(statikFS)
	e.Any("*", echo.WrapHandler(AddFallbackHandler(spaHandler.ServeHTTP, statikFS)))

	e.Logger.Fatal(e.Start(":4000"))
}

func listUsers(c echo.Context) error {
	ac := c.(*AppContext)
	return c.JSON(http.StatusOK, users.GetAll(ac.Kubeclient))
}

func createUser(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		Name string `json:"name" validate:"required"`
	}
	type Reponse = users.User
	r := new(Request)
	if err := c.Bind(r); err != nil {
		panic(err)
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
	}

	u := users.CreateUser(ac.Kubeclient, r.Name)

	return c.JSON(http.StatusOK, Reponse{Name: u.Name})
}

func listGroups(c echo.Context) error {
	type Group struct {
		Name string `json:"name"`
	}
	return c.JSON(http.StatusOK, []Group{})
}

func listNamespaces(c echo.Context) error {
	ac := c.(*AppContext)

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

func createClusterRole(c echo.Context) error {
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

func createRolebinding(c echo.Context) error {
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

func createKubeconfig(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		Username string `json:"username"`
	}
	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	kubeconfig := kube.CreateKubeconfigYAML(ac.Kubeclient, r.Username)

	type Response struct {
		Ok         bool   `json:"ok"`
		Kubeconfig string `json:"kubeconfig"`
	}
	return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeconfig})
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

// AddFallbackHandler wraps the handler func in another handler func covering authentication
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
