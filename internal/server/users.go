package server

import (
	"github.com/labstack/echo"
	"net/http"
	"sighupio/permission-manager/internal/resources"
)

func listUsers(us resources.UserService) echo.HandlerFunc {
	return func(c echo.Context) error {
		users, err := us.GetAllUsers(c.Request().Context())

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, users)
	}
}

func createUser(us resources.UserService) echo.HandlerFunc {
	return func(c echo.Context) error {
		type request struct {
			Name string `json:"name" validate:"required"`
		}
		type response = resources.User
		r := new(request)
		if err := c.Bind(r); err != nil {
			return err
		}

		if err := c.Validate(r); err != nil {
			return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
		}

		if !isValidUsername(r.Name) {
			return c.JSON(http.StatusBadRequest, ErrorRes{invalidUsernameError})
		}

		u, err := us.CreateUser(c.Request().Context(), r.Name)

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, response{Name: u.Name})
	}
}

func deleteUser(us resources.UserService) echo.HandlerFunc {
	return func(c echo.Context) error {

		type Request struct {
			Username string `json:"username" validate:"required"`
		}

		r := new(Request)
		if err := c.Bind(r); err != nil {
			return err
		}
		if err := c.Validate(r); err != nil {
			return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
		}

		err := us.DeleteUser(c.Request().Context(), r.Username)

		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, OkRes{Ok: true})
	}
}
