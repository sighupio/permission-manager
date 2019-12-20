package createkubeconfigusecase

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	retry "github.com/avast/retry-go"
	v1beta1 "k8s.io/api/certificates/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func getSignedCertificateForUser(kc kubernetes.Interface, username string, privateKey *rsa.PrivateKey) (certificatePemBytes []byte) {
	_, csrPemByte := createCSR(username, privateKey)
	certsClients := kc.CertificatesV1beta1()
	csrObjectName := "CSR_FOR_" + username + time.Now().String()

	_, err := certsClients.CertificateSigningRequests().Create(&v1beta1.CertificateSigningRequest{
		Spec: v1beta1.CertificateSigningRequestSpec{
			Groups:  []string{"system:authenticated"},
			Request: []byte(csrPemByte),
			Usages:  []v1beta1.KeyUsage{"digital signature", "key encipherment", "client auth"},
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: csrObjectName,
		},
	})
	if err != nil {
		log.Printf("Failed to create CSR Object %s\n%v", csrObjectName, err)
	}

	_, err = certsClients.CertificateSigningRequests().UpdateApproval(&v1beta1.CertificateSigningRequest{
		TypeMeta: metav1.TypeMeta{
			Kind:       "CertificateSigningRequest",
			APIVersion: "certificates.k8s.io/v1beta1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: csrObjectName,
		},
		Status: v1beta1.CertificateSigningRequestStatus{
			Conditions: []v1beta1.CertificateSigningRequestCondition{
				v1beta1.CertificateSigningRequestCondition{
					Type:    "Approved",
					Reason:  "New User",
					Message: fmt.Sprintf("Approving CSR for user: %s", username),
				},
			},
		},
	})
	if err != nil {
		log.Printf("Failed to approve CSR: %s\n%v", csrObjectName, err)
	}

	err = retry.Do(
		func() error {
			res, err := certsClients.CertificateSigningRequests().Get(csrObjectName, metav1.GetOptions{})
			if err != nil {
				log.Printf("Failed to get approved CSR: %s\n%v", csrObjectName, err)
			}
			cert := res.Status.Certificate

			if len(cert) > 0 {
				certificatePemBytes = res.Status.Certificate
				return nil
			}

			return fmt.Errorf("certificate not yet approved")
		},
	)
	if err != nil {
		log.Print("Failed to retry get approved CSR")
	}

	err = certsClients.CertificateSigningRequests().Delete(csrObjectName, nil)
	if err != nil {
		log.Printf("Failed to delete CSR: %s\n%v", csrObjectName, err)
	}

	return
}

func createRsaPrivateKeyPem() (privateKey *rsa.PrivateKey, privPemBytes []byte) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Printf("Failed to generate RSA key\n%v", err)
	}

	privPemBytes = pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
		},
	)

	return
}

func createCSR(username string, privateKey *rsa.PrivateKey) (csrBytes []byte, csrPemBytes []byte) {
	template := x509.CertificateRequest{
		Subject: pkix.Name{
			CommonName: username,
		},
		SignatureAlgorithm: x509.SHA256WithRSA,
	}

	csrBytes, err := x509.CreateCertificateRequest(rand.Reader, &template, privateKey)
	if err != nil {
		log.Printf("Failed to create CSR for user: %s\n%v", username, err)
	}

	csrPemBytes = pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE REQUEST", Bytes: csrBytes})

	return
}

func getCaBase64() string {
	ca := ""
	/* REFACTOR: read and encode base64 from go */
	if os.Getenv("KUBERNETES_SERVICE_HOST") == "" {
		fp := filepath.Join(os.Getenv("HOME"), ".minikube", "ca.crt")
		s := fmt.Sprintf("cat %s | base64 | tr -d '\n'", fp)
		caBase64, err := exec.Command("sh", "-c", s).Output()
		if err != nil {
			panic(err)
		}
		ca = string(caBase64)
	} else {
		fmt.Println("detected runnig inside cluster")
		s := "cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt | base64 | tr -d '\n'"
		caBase64, err := exec.Command("sh", "-c", s).Output()
		if err != nil {
			panic(err)
		}
		ca = string(caBase64)
	}
	return ca
}
