# permission-manager
load('ext://restart_process', 'docker_build_with_restart')

docker_build_with_restart(
  "permission-manager",
  ".",
  target="development",
  build_args={
    "NETRC_FILE": read_file("%s/.netrc" % os.getenv("HOME")),
  },
  live_update=[
    sync("./cmd", "/app/cmd"),
    sync("./internal", "/app/internal"),
    sync("./Makefile", "/app/Makefile"),
    sync("./statik", "/app/statik"),
    sync("./go.mod", "/app/go.mod"),
    sync("./go.sum", "/app/go.sum"),
  ],
  entrypoint=["go", "run", "cmd/run-server.go"]
)

manifests = kustomize("deployments/kustomization/development")

k8s_yaml(manifests)

cms = [obj['metadata']['name'] for obj in decode_yaml_stream(manifests) if obj.get("kind") == "ConfigMap"]

k8s_resource(
  workload="permission-manager",
  links=[
    link("https://pm.fip.dev/", "permission-manager"),
  ],
  objects=[
    "permission-manager:ingress",
  ] + cms,
  labels="control-plane"
)
