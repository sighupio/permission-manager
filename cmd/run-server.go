package main

import (
	"sighupio/permission-manager/internal/adapters/kubeclient"
	"sighupio/permission-manager/internal/app/resources"
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/entrypoints/server"
)

func main() {
	cfg := config.New()
	kc := kubeclient.New()
	rs := resources.NewResourcesService(kc)

	/*  TO REFACTOR
	 * server should depend on app and use app's usecases,
	 * app should be initialized with services
	 * services should be initialized with repositories/data
	 */
	s := server.New(kc, cfg, rs)
	s.Logger.Fatal(s.Start(":4000"))
}
