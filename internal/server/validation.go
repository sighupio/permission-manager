package server

import (
	"net/http"
	"regexp"

	"github.com/go-playground/validator"
)

const validUsernameRegex = "^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$"

var invalidUsernameError = `username must be DNS-1123 compliant, it must consist of lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character (e.g. 'gino.mycompany', regex used for validation is ` + validUsernameRegex

func isValidUsername(username string) (valid bool) {
	re := regexp.MustCompile(validUsernameRegex)
	return re.MatchString(username)
}

type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	return cv.validator.Struct(i)

}

func (c *AppContext) validateAndBindRequest(r interface{}) error {

	if err := c.Bind(r); err != nil {
		return err
	}

	if err := c.Validate(r); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorRes{err.Error()})
	}

	return nil
}
