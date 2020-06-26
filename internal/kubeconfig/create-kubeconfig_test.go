package kubeconfig

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateKubeconfig(t *testing.T) {
	got := createKubeconfig("My-cluster", "gino", "pangolier", "https://100.200.10.200", "CA_BASE64", "TOKEN")

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
