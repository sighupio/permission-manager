package resources

import (
	"context"
	"sighupio/permission-manager/internal/config"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateKubeconfig(t *testing.T) {
	t.Skip("needs refactor")

	clusterConfig := config.ClusterConfig{
		Name:                "My-cluster",
		ControlPlaneAddress: "https://100.200.10.200",
	}

	rs := NewManager(NewFakeKubeClient(), context.TODO())

	got := rs.ServiceAccountCreateKubeConfigForUser(clusterConfig, "gino", "pangolier")

	want := `---
apiVersion: v1
kind: Config
current-context: gino@My-cluster
clusters:
  - cluster:
      certificate-authority-data: CA_BASE64
      server: https://100.200.10.200
    name: My-cluster
contexts:
  - context:
      cluster: My-cluster
      user: gino
      namespace: pangolier
    name: gino@My-cluster
users:
  - name: gino
    user:
      token: TOKEN`

	assert.Equal(t, want, got)
}
