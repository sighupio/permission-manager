package server

import (
	"github.com/labstack/echo"
	"sighupio/permission-manager/internal/resources"
)

func listUsers(c echo.Context) error {
	ac := c.(*AppContext)

	users, err := ac.ResourceManager.UserList()

	if err != nil {
		return err
	}

	return ac.okResponseWithData(users)
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
		return ac.errorResponse(invalidUsernameError)
	}

	u, err := ac.ResourceManager.UserCreate(r.Name)

	if err != nil {
		return err
	}

	return ac.okResponseWithData(response{Name: u.Name})
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

	err = ac.ResourceManager.UserDelete(r.Username)

	if err != nil {
		return err
	}

	return ac.okResponse()
}
