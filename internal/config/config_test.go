package config_test

import (
	"fmt"
	"os"
	"sighupio/permission-manager/internal/config"
)

func ExampleNew() {
	os.Setenv("PORT", "4000")
	os.Setenv("CLUSTER_NAME", "my-cluster")
	os.Setenv("CONTROL_PLANE_ADDRESS", "https://192.168.64.33:8443")
	os.Setenv("NAMESPACE", "test")

	cfg := config.New()

	fmt.Println(cfg.Backend.Port)
	fmt.Println(cfg.Cluster.Name)
	fmt.Println(cfg.Cluster.ControlPlaneAddress)
	fmt.Println(cfg.Cluster.Namespace)
	
	// Output:
	// 4000
	// my-cluster
	// https://192.168.64.33:8443
	// test
}
