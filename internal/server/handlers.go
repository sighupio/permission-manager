package server

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"sighupio/permission-manager/internal/kubeconfig"
	"sighupio/permission-manager/internal/resources"

	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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


func ListNamespaces(rs resources.ResourcesService) echo.HandlerFunc {
	return func(c echo.Context) error {
		type Response struct {
			Namespaces []string `json:"namespaces"`
		}

		names, err := rs.GetAllNamespaces(c.Request().Context())

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, Response{
			Namespaces: names,
		})
	}
}

func listRbac(c echo.Context) error {
	ac := c.(*AppContext)
	type Response struct {
		ClusterRoles        []rbacv1.ClusterRole        `json:"clusterRoles"`
		ClusterRoleBindings []rbacv1.ClusterRoleBinding `json:"clusterRoleBindings"`
		Roles               []rbacv1.Role               `json:"roles"`
		RoleBindings        []rbacv1.RoleBinding        `json:"roleBindings"`
	}

	clusterRoles, err := ac.Kubeclient.RbacV1().ClusterRoles().List(c.Request().Context(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	clusterRoleBindings, err := ac.Kubeclient.RbacV1().ClusterRoleBindings().List(c.Request().Context(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	roles, err := ac.Kubeclient.RbacV1().Roles("").List(c.Request().Context(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	roleBindings, err := ac.Kubeclient.RbacV1().RoleBindings("").List(c.Request().Context(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, Response{
		ClusterRoles:        clusterRoles.Items,
		ClusterRoleBindings: clusterRoleBindings.Items,
		Roles:               roles.Items,
		RoleBindings:        roleBindings.Items,
	})
}



func createKubeconfig(clusterName, clusterControlPlaceAddress string) echo.HandlerFunc {
	type Request struct {
		Username  string `json:"username"`
		Namespace string `json:"namespace"`
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

		// if no namespace is set we set the value "default"
		if r.Namespace == "" {
			r.Namespace = "default"
		}

		kubeCfg := kubeconfig.CreateKubeconfigYAMLForUser(c.Request().Context(), ac.Kubeclient, clusterName, clusterControlPlaceAddress, r.Username, r.Namespace)

		return c.JSON(http.StatusOK, Response{Ok: true, Kubeconfig: kubeCfg})
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


func addFallbackHandler(handler http.HandlerFunc, fs http.FileSystem) http.HandlerFunc {
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
