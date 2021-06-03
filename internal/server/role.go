package server

import (
	"github.com/labstack/echo"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func deleteRole(c echo.Context) error {
	ac := c.(*AppContext)

	type Request struct {
		RoleName  string `json:"roleName" validate:"required"`
		Namespace string `json:"namespace" validate:"required"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}

	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, err)
	}

	err := ac.Kubeclient.RbacV1().Roles(r.Namespace).Delete(c.Request().Context(), r.RoleName, metav1.DeleteOptions{})

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, OkRes{Ok: true})
}

func deleteRolebinding(c echo.Context) error {
	ac := c.(*AppContext)
	type Request struct {
		RolebindingName string `json:"rolebindingName" validate:"required"`
		Namespace       string `json:"namespace" validate:"required"`
	}

	r := new(Request)
	if err := c.Bind(r); err != nil {
		return err
	}
	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, err)
	}

	err := ac.Kubeclient.RbacV1().RoleBindings(r.Namespace).Delete(c.Request().Context(), r.RolebindingName, metav1.DeleteOptions{})

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, OkRes{Ok: true})
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
		return c.JSON(http.StatusBadRequest, err)
	}

	_, err := ac.Kubeclient.RbacV1().RoleBindings(r.Namespace).Create(c.Request().Context(), &rbacv1.RoleBinding{
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
	}, metav1.CreateOptions{})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorRes{Error: err.Error()})
	}

	return c.JSON(http.StatusOK, OkRes{Ok: true})
}
