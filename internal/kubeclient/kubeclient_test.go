package kubeclient

import (
	"os"
	"testing"
)

import "github.com/stretchr/testify/assert"

func TestInsideKubernetesCluster(t *testing.T) {
	assert.False(t, insideKubernetesCluster())

	os.Setenv("KUBERNETES_SERVICE_HOST", "10.119.0.1")
	assert.True(t, insideKubernetesCluster())
}
