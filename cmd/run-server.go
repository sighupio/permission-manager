package main

import (
	"log"
	"os"

	"sighupio/permission-manager/internal/adapters/kubeclient"
	"sighupio/permission-manager/internal/app/resources"
	"sighupio/permission-manager/internal/config"
	"sighupio/permission-manager/internal/entrypoints/server"
)

func main() {
	cfg := config.New()

	clusterName := os.Getenv("CLUSTER_NAME")
	if clusterName == "" {
		log.Fatal("CLUSTER_NAME env cannot be empty")
	} else {
		cfg.ClusterName = clusterName
	}

	clusterControlPlaceAddress := os.Getenv("CONTROL_PLANE_ADDRESS")
	if clusterControlPlaceAddress == "" {
		log.Fatal("CONTROL_PLANE_ADDRESS env cannot be empty")
	} else {
		cfg.ClusterControlPlaceAddress = clusterControlPlaceAddress
	}

	kc := kubeclient.New()
	rs := resources.NewResourcesService(kc)
	s := server.New(kc, cfg, rs)
	s.Logger.Fatal(s.Start(":4000"))
}
