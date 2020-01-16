package config_test

import (
	"fmt"
	"os"
	"sighupio/permission-manager/internal/config"
)

func ExampleNew() {
	os.Setenv("CLUSTER_NAME", "my-cluster")
	os.Setenv("CONTROL_PLANE_ADDRESS", "https://192.168.64.33:8443")
	cfg := config.New()

	fmt.Println(cfg.ClusterName)
	fmt.Println(cfg.ClusterControlPlaceAddress)

	// Output:
	// my-cluster
	// https://192.168.64.33:8443
}
