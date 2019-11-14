package kube

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

// CreateKubeconfigYAML returns a kubeconfig YAML string
func CreateKubeconfigYAML(username string) (kubeconfigYAML string) {

	/* TODO */
	// refactor to use CSR api

	rsaFile, err := ioutil.TempFile(os.TempDir(), "prefix-")
	if err != nil {
		log.Fatal("Cannot create temporary file", err)
	}
	defer os.Remove(rsaFile.Name())

	rsaPrivateKey, err := exec.Command("openssl", "genrsa", "4096").Output()
	if err != nil {
		log.Fatal(err)
	}

	if _, err = rsaFile.Write(rsaPrivateKey); err != nil {
		log.Fatal("Failed to write to temporary file", err)
	}

	subj := fmt.Sprintf("/CN=%s", username)
	cmd := exec.Command("openssl", "req", "-new", "-key", rsaFile.Name(), "-subj", subj)
	csr, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Println(fmt.Sprint(err))
	}

	clientCsrFile, err := ioutil.TempFile(os.TempDir(), "prefix-")
	if err != nil {
		log.Fatal("Cannot create temporary file", err)
	}
	if _, err = clientCsrFile.Write(csr); err != nil {
		log.Fatal("Failed to write to temporary file", err)
	}

	defer os.Remove(clientCsrFile.Name())
	crt, err := exec.Command("openssl", "x509", "-req", "-days", "365", "-sha256",
		"-in",
		clientCsrFile.Name(),
		"-CA",
		filepath.Join(os.Getenv("HOME"), ".minikube", "ca.crt"),
		// "-CAkey",
		// filepath.Join(os.Getenv("HOME"), ".minikube", "ca.key"),
		"-set_serial",
		"2",
	).Output()
	if err != nil {
		log.Fatal(err)
	}

	clusterName := "minikube"

	s := "cert | base64 | tr -d '\n'"

	ca := ""

	if os.Getenv("KUBERNETES_SERVICE_HOST") == "" {
		ca = "certificate-authority: " + filepath.Join(os.Getenv("HOME"), ".minikube", "ca.crt")
		fmt.Println("################# ca:")
		fmt.Println(ca)
	} else {
		caBase64, err := exec.Command("sh", "-c", s).Output()
		fmt.Println("$$$$$$$$$$$ caBase64:")
		fmt.Println(caBase64)
		if err != nil {
			panic(err)
		}
		ca = "certificate-authority-data: " + string(caBase64)
	}

	crtBase64 := base64.StdEncoding.EncodeToString(crt)
	rsaPrivateKeyBase64 := base64.StdEncoding.EncodeToString(rsaPrivateKey)

	kubeconfigYAML = fmt.Sprintf(`apiVersion: v1
kind: Config
preferences:
    colors: true
current-context: %s
clusters:
  - name: %s
    cluster:
      server: https://192.168.64.24:8443
      %s
contexts:
  - context:
      cluster: %s
      user: %s
    name: %s
users:
  - name: %s
    user:
      client-certificate-data: %s
      client-key-data: %s`,
		clusterName, clusterName, ca, clusterName, username, clusterName, username, crtBase64, rsaPrivateKeyBase64)

	return kubeconfigYAML
}
