package kubeconfig

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"log"
	"time"

	retry "github.com/avast/retry-go"
	v1beta1 "k8s.io/api/certificates/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8sclient "k8s.io/client-go/kubernetes"
	runtime "sigs.k8s.io/controller-runtime"
)

// getSignedCertificateForUser generates a K8s API client certificate for the a User with the given username.
func getSignedCertificateForUser(ctx context.Context, kc k8sclient.Interface, username string, privateKey *rsa.PrivateKey) []byte {
	var csrName = fmt.Sprintf("pm-user-%s-%d", username, time.Now().Unix())
	var certPemBytes []byte

	// make sure to delete the created certificates.k8s.io/v1beta1 CertificateSigningRequest object
	// in case of both success or error
	defer deleteCertificateSigningRequest(ctx, kc, csrName)

	// create the certificates.k8s.io/v1beta1 CertificateSigningRequest object.
	csrSignerName := "kubernetes.io/kube-apiserver-client"
	csr := &v1beta1.CertificateSigningRequest{
		ObjectMeta: metav1.ObjectMeta{
			Name: csrName,
		},
		Spec: v1beta1.CertificateSigningRequestSpec{
			SignerName: &csrSignerName,
			Groups:     []string{"system:authenticated"},
			Request:    createCSR(username, privateKey),
			Usages:     []v1beta1.KeyUsage{"digital signature", "key encipherment", "client auth"},
		},
	}
	_, err := kc.CertificatesV1beta1().CertificateSigningRequests().Create(ctx, csr, metav1.CreateOptions{})
	if err != nil {
		log.Printf("Failed to create CSR Object %s\n%v", csrName, err)
		return nil
	}

	// mark the certificates.k8s.io/v1beta1 CertificateSigningRequest object as approved.
	csrApproval := &v1beta1.CertificateSigningRequest{
		ObjectMeta: metav1.ObjectMeta{
			Name: csrName,
		},
		Status: v1beta1.CertificateSigningRequestStatus{
			Conditions: []v1beta1.CertificateSigningRequestCondition{
				v1beta1.CertificateSigningRequestCondition{
					Type:    "Approved",
					Reason:  "Permission Manager - New User",
					Message: fmt.Sprintf("Approving CSR for user: %s", username),
				},
			},
		},
	}
	_, err = kc.CertificatesV1beta1().CertificateSigningRequests().UpdateApproval(ctx, csrApproval, metav1.UpdateOptions{})
	if err != nil {
		log.Printf("Failed to approve CSR: %s\n%v", csrName, err)
		return nil
	}

	// wait until the signed certificate for the certificates.k8s.io/v1beta1 CertificateSigningRequest object is created
	// by the Kubernetes certificates-manager.
	err = retry.Do(
		func() error {
			res, err := kc.CertificatesV1beta1().CertificateSigningRequests().Get(ctx, csrName, metav1.GetOptions{})
			if err != nil {
				return fmt.Errorf("Failed to get approved CSR: %s\n%v", csrName, err)
			}

			// check if Certificate is set in the Status of the CSR
			cert := res.Status.Certificate
			if len(cert) > 0 {
				certPemBytes = res.Status.Certificate
				return nil
			}

			return fmt.Errorf("Certificate status: %s", res.Status.Conditions)
		},
		retry.Attempts(50),
		retry.Delay(100*time.Millisecond),
	)
	if err != nil {
		log.Printf("Failed to get signed certificate for CSR: %s\n%v", csrName, err)
		return nil
	}

	// return the generate K8s api-server client certificate
	return certPemBytes
}

// deleteCertificateSigningRequest deletes a certificates.k8s.io/v1beta1 CertificateSigningRequest object
// with the given csrName from the Kubernetes cluster.
func deleteCertificateSigningRequest(ctx context.Context, kc k8sclient.Interface, csrName string) {
	err := kc.CertificatesV1beta1().CertificateSigningRequests().Delete(ctx, csrName, metav1.DeleteOptions{})
	if err != nil {
		log.Printf("Failed to delete CSR: %s\n%v", csrName, err)
	}
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

// createCRS creates a new K8s client certificate signing request.
// Following the K8s RBAC specifications, the CSR will have as common-name the username and will be signed with the
// user private RSA key.
// The content of the CSR is returnend in PEM format.
func createCSR(username string, privateKey *rsa.PrivateKey) []byte {
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

	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE REQUEST", Bytes: csrBytes})
}

// getCaBase64 returns the base64 encoding of the Kubernetes cluster api-server CA
func getCaBase64() string {

	config, err := runtime.GetConfig()

	if err != nil {
		log.Fatalf("Unable to get kubeconfig.\n%v", err)
	}

	return base64.StdEncoding.EncodeToString(config.CAData)

}
