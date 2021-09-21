package server

import (
	"log"
	"net/http"
	"os"

	"github.com/go-playground/validator"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/resources"
	_ "sighupio/permission-manager/statik"

	"github.com/rakyll/statik/fs"
)

func New(cfg config.Config) *echo.Echo {
	e := echo.New()

	e.Validator = &CustomValidator{validator: validator.New()}

	addMiddlewareStack(e, cfg)

	addRoutes(e)

	//workaround to avoid breaking changes in production. We disable the react bundle in local testing
	if os.Getenv("IS_LOCAL_DEVELOPMENT") != "true" {
		addStaticFileServe(e)
	}

	return e
}

func addMiddlewareStack(e *echo.Echo, cfg config.Config) {
	basicAuthPassword := os.Getenv("BASIC_AUTH_PASSWORD")

	if basicAuthPassword == "" {
		log.Fatal("BASIC_AUTH_PASSWORD env cannot be empty")
	}

	// enable cors in local development
	if os.Getenv("IS_LOCAL_DEVELOPMENT") == "true" {
		e.Use(middleware.CORS())

	}

	e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
		if username == "admin" && password == basicAuthPassword {
			return true, nil
		}
		return false, nil
	}))

	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method}, uri=${uri}, status=${status}\n",
	}))

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			customContext := &AppContext{
				Context:         c,
				ResourceManager: resources.NewManager(resources.NewKubeClient(), c.Request().Context()),
				Config:          cfg,
			}
			return next(customContext)
		}
	})

}

func addStaticFileServe(e *echo.Echo) {
	statikFS, err := fs.New()
	if err != nil {
		e.Logger.Fatal(err)
	}

	spaHandler := http.FileServer(statikFS)
	/* allow every call to unknown paths to return index.html, this necessary when refreshing the browser at an url that is not backed by a real file but only a client route*/
	e.Any("*", echo.WrapHandler(addFallbackHandler(spaHandler.ServeHTTP, statikFS)))
}

func addRoutes(e *echo.Echo) {
	api := e.Group("/api")

	api.GET("/list-users", listUsers)
	api.GET("/list-namespace", ListNamespaces)
	api.GET("/rbac", listRbac)

	api.POST("/create-cluster-role", createClusterRole)
	api.POST("/create-user", createUser)
	api.POST("/create-rolebinding", createRoleBinding)
	api.POST("/create-cluster-rolebinding", createClusterRolebinding)

	/* should use DELETE method, using POST due to a weird bug that looks now resolved */
	api.POST("/delete-cluster-role", deleteClusterRole)
	api.POST("/delete-cluster-rolebinding", deleteClusterRolebinding)
	api.POST("/delete-rolebinding", deleteRolebinding)
	api.POST("/delete-role", deleteRole)
	api.POST("/delete-user", deleteUser)

	api.POST("/create-kubeconfig", createKubeconfig)
	api.POST("/check-legacy-user", checkLegacyUser)
}
