package main

import (
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/kubeclient"
	"sighupio/permission-manager/internal/server"
)

func main() {
	cfg := config.New()
	kc := kubeclient.New()

	s := server.New(kc, *cfg)
	addr := ":" + cfg.Port
	s.Logger.Fatal(s.Start(addr))
}
