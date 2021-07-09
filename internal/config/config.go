package config

import (
	"log"
	"os"
)

type ClusterConfig struct {
	Name                string
	ControlPlaneAddress string
}

type BackendConfig struct {
	Port string
}

// Config contains PermissionManager cluster/server configuration
type Config struct {
	Cluster ClusterConfig
	Backend BackendConfig
}

func New() *Config {
	cfg := &Config{
		Cluster: ClusterConfig{
			Name:                os.Getenv("CLUSTER_NAME"),
			ControlPlaneAddress: os.Getenv("CONTROL_PLANE_ADDRESS"),
		},
		Backend: BackendConfig{
			Port: os.Getenv("PORT"),
		},
	}

	if cfg.Backend.Port == "" {
		log.Fatal("PORT env cannot be empty")
	}

	if cfg.Cluster.Name == "" {
		log.Fatal("CLUSTER_NAME env cannot be empty")
	}

	if cfg.Cluster.ControlPlaneAddress == "" {
		log.Fatal("CONTROL_PLANE_ADDRESS env cannot be empty")
	}

	return cfg
}
