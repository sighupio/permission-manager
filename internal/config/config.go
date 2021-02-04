package config

import (
	"log"
	"os"
)

type Config struct {
	ClusterName                string
	ClusterControlPlaceAddress string
	Port                       string
}

func New() *Config {
	cfg := &Config{
		ClusterName:                os.Getenv("CLUSTER_NAME"),
		ClusterControlPlaceAddress: os.Getenv("CONTROL_PLANE_ADDRESS"),
		Port:                       os.Getenv("PORT"),
	}

	if cfg.Port == "" {
		log.Fatal("PORT env cannot be empty")
	}

	if cfg.ClusterName == "" {
		log.Fatal("CLUSTER_NAME env cannot be empty")
	}

	if cfg.ClusterControlPlaceAddress == "" {
		log.Fatal("CONTROL_PLANE_ADDRESS env cannot be empty")
	}

	return cfg
}
