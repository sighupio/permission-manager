package main

import (
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/kubeclient"
	"sighupio/permission-manager/internal/resources"
	"sighupio/permission-manager/internal/server"
)

func main() {
	cfg := config.New()
	kc := kubeclient.New()
	rs := resources.NewResourcesService(kc)

	s := server.New(kc, cfg, rs)
	addr := ":" + cfg.Port
	s.Logger.Fatal(s.Start(addr))
}
