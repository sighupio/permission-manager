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
	cfg := &Config{}

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT env cannot be empty")
	} else {
		cfg.Port = port
	}

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

	return cfg
}
