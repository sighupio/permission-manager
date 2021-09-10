package main

import (
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/server"
)

func main() {
	cfg := config.New()

	s := server.New(*cfg)
	addr := ":" + cfg.Backend.Port
	s.Logger.Fatal(s.Start(addr))
}
