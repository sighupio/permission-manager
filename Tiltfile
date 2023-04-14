# Load config setup
load_dynamic("./development/tiltfiles/setup.tiltfile")

load('ext://restart_process', 'docker_build_with_restart')

docker_build_with_restart(
  "permission-manager:local-dev",
  ".",
  target="development",
  live_update=[
    sync("./static", "/app/static"),
    sync("./cmd", "/app/cmd"),
    sync("./internal", "/app/internal"),
    sync("./go.mod", "/app/go.mod"),
    sync("./go.sum", "/app/go.sum"),
    # sync("./web-client", "/app/web-client"),
  ],
  build_args={
    "CLUSTER_NAME": os.getenv("CLUSTER_NAME"),
    "CONTROL_PLANE_ADDRESS": os.getenv("CONTROL_PLANE_ADDRESS"),
    "BASIC_AUTH_PASSWORD": os.getenv("BASIC_AUTH_PASSWORD"),
    "NAMESPACE": os.getenv("NAMESPACE"),
    "PORT": os.getenv("PORT"),
  },
  entrypoint=["go", "run", "cmd/run-server.go"]
)

docker_build(
  "permission-manager-ui-image:local-dev",
  ".",
  dockerfile="Dockerfile-ui",
  # target="development",
  live_update=[
    sync("./web-client", "/app/web-client"),
  ],
  build_args={
    "CLUSTER_NAME": os.getenv("CLUSTER_NAME"),
    "CONTROL_PLANE_ADDRESS": os.getenv("CONTROL_PLANE_ADDRESS"),
    "BASIC_AUTH_PASSWORD": os.getenv("BASIC_AUTH_PASSWORD"),
    "NAMESPACE": os.getenv("NAMESPACE"),
    "PORT": os.getenv("PORT"),
  },
  # entrypoint=["yarn", "start"]
)

k8s_yaml(
  helm(
    './helm_chart',
    name='permission-manager',
    namespace='permission-manager',
    values='development/helm/values.yaml',
    set=['config.controlPlaneAddress=' + os.getenv("CONTROL_PLANE_ADDRESS")]
  )
)

k8s_resource(
  workload="permission-manager",
  links=[
    link("https://permission-manager.dev/", "permission-manager"),
  ],
  # objects=[] + cms,
  labels="control-plane"
)

k8s_resource(
  workload="permission-manager-ui",
  links=[
    link("https://permission-manager.dev/", "permission-manager-ui"),
  ],
  # objects=[] + cms,
  labels="front-end"
)
