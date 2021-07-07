package server

import (
	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	res "sighupio/permission-manager/internal/resources"
)

func deleteRole(rs res.ResourceService) echo.HandlerFunc {
	return func(c echo.Context) error {

		type Request struct {
			RoleName  string `json:"roleName" validate:"required"`
			Namespace string `json:"namespace" validate:"required"`
		}

		r := new(Request)

		if err := c.Bind(r); err != nil {
			return err
		}

		if err := c.Validate(r); err != nil {
			return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
		}

		err := rs.DeleteRole(r.Namespace, r.RoleName, c.Request().Context())

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, OkRes{Ok: true})
	}
}

func deleteRolebinding(rs res.RoleBindingService) echo.HandlerFunc {

	return func(c echo.Context) error {
		type Request struct {
			RolebindingName string `json:"rolebindingName" validate:"required"`
			Namespace       string `json:"namespace" validate:"required"`
		}

		r := new(Request)
		if err := c.Bind(r); err != nil {
			return err
		}
		if err := c.Validate(r); err != nil {
			return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
		}

		err := rs.DeleteRoleBinding(r.Namespace, r.RolebindingName, c.Request().Context())

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, OkRes{Ok: true})
	}
}

func createRoleBinding(rs res.RoleBindingService) echo.HandlerFunc {

	return func(c echo.Context) error {
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

		rbRequest := &rbacv1.RoleBinding{
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
		}

		_, err := rs.CreateRole(r.Namespace, c.Request().Context(), rbRequest)

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, OkRes{Ok: true})
	}
}
