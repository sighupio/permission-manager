package server

import (
	"github.com/labstack/echo"
	"k8s.io/client-go/kubernetes"
	"net/http"
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/resources"
)

// AppContext echo context extended with application specific fields
type AppContext struct {
	echo.Context
	Kubeclient      kubernetes.Interface
	ResourceService resources.ResourceService
	Config          config.Config
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

// to deprecate. No reason in sending OkRes struct, there is already HTTP Code 2xx for that
func (c *AppContext) okResponse() error {
	return c.JSON(http.StatusOK, OkRes{Ok: true})
}

func (c *AppContext) okResponseWithData(response interface{}) error {
	return c.JSON(http.StatusOK, response)

}

func (c *AppContext) errorResponse(error string) error {
	return c.JSON(http.StatusBadRequest, ErrorRes{error})

}
