package createkubeconfigusecase

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateKubeconfig(t *testing.T) {
	got := createKubeconfig("My-cluster", "gino", "https://100.200.10.200", "CA_BASE64", "CERTIFICATE_BASE64", "PRIVATE_KEY_BASE64")

	want := `apiVersion: v1
kind: Config
preferences:
	colors: true
current-context: My-cluster
clusters:
	- name: My-cluster
	cluster:
		server: https://100.200.10.200
		certificate-authority-data: CA_BASE64
contexts:
	- context:
		cluster: My-cluster
		user: gino
	name: My-cluster
users:
	- name: gino
	user:
		client-certificate-data: CERTIFICATE_BASE64
		  client-key-data: PRIVATE_KEY_BASE64`

	assert.Equal(t, want, got)
}
