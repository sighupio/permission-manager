package server

import (
	"github.com/labstack/echo"
	"net/http"
	"sighupio/permission-manager/internal/resources"
)

func listUsers(c echo.Context) error {
	ac := c.(*AppContext)

	users, err := ac.ResourceService.GetAllUsers()

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, users)
}

func createUser(c echo.Context) error {
	ac := c.(*AppContext)

	type request struct {
		Name string `json:"name" validate:"required"`
	}
	type response = resources.User
	r := new(request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	if !isValidUsername(r.Name) {
		return c.JSON(http.StatusBadRequest, ErrorRes{invalidUsernameError})
	}

	u, err := ac.ResourceService.CreateUser(r.Name)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, response{Name: u.Name})
}

func deleteUser(c echo.Context) error {
	ac := c.(*AppContext)

	type Request struct {
		Username string `json:"username" validate:"required"`
	}

	r := new(Request)

	err := ac.validateAndBindRequest(r)

	if err != nil {
		return err
	}

	err = ac.ResourceService.DeleteUser(r.Username)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, OkRes{Ok: true})
}
