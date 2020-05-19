
kubectl apply -f k8s/k8s-seeds/namespace.yml
kubectl apply -f k8s/k8s-seeds
export CLUSTER_NAME=$(kubectl config current-context)
export CONTROL_PLANE_ADDRESS=$(kubectl config view --minify | grep server | cut -f 2- -d ":" | tr -d " ")
kustomize build | envsubst | kubectl apply -f -

# make port-forward &

    # -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0' \
    # -H 'Accept: application/json, text/plain, */*' \
    # -H 'Accept-Language: en-US,en;q=0.5' \
    # --compressed \
    # -H 'Origin: http://localhost:4000' \
    # -H 'Connection: keep-alive' \
    # -H 'Referer: http://localhost:4000/new-user' \
    # -H 'Cookie: _ga=GA1.1.977870211.1589280043' \
curl -X POST 'http://localhost:4000/api/create-user' \
    -H 'Content-Type: application/json;charset=utf-8' \
    -H 'Authorization: Basic YWRtaW46MXYyZDFlMmU2N2RT' \
    --data-raw '{"name":"asdf"}'

curl -X POST 'http://localhost:4000/api/create-rolebinding' \
    -H 'Content-Type: application/json;charset=utf-8' \
    -H 'Authorization: Basic YWRtaW46MXYyZDFlMmU2N2RT' \
    --data-raw '{"generated_for_user":"asdf","roleName":"template-namespaced-resources___developer","namespace":"permission-manager","roleKind":"ClusterRole","subjects":[{"kind":"User","name":"asdf","apiGroup":"rbac.authorization.k8s.io"}],"rolebindingName":"asdf___template-namespaced-resources___developer___permission-manager"}'

curl -X POST 'http://localhost:4000/api/create-cluster-rolebinding' \
    -H 'Content-Type: application/json;charset=utf-8' \
    -H 'Authorization: Basic YWRtaW46MXYyZDFlMmU2N2RT' \
    --data-raw '{"generated_for_user":"asdf","roleName":"template-cluster-resources___admin","subjects":[{"kind":"User","name":"asdf","apiGroup":"rbac.authorization.k8s.io"}],"clusterRolebindingName":"asdf___template-cluster-resources___admin"}'

curl -X POST 'http://localhost:4000/api/create-kubeconfig' \
    -H 'Content-Type: application/json;charset=utf-8' \
    -H 'Authorization: Basic YWRtaW46MXYyZDFlMmU2N2RT' \
    -H 'Accept: application/json, text/plain, */*' \
    --data-raw '{"username":"asdf"}'
