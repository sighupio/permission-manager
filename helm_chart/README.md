# Permission Manager Helm Chart - v1.8.0-rc1

A Helm chart for Permission Manager, a simple to use, web application that enables a super-easy and user-friendly RBAC management for Kubernetes.

## Configuration options

The following table lists the configurable parameters of the Permission Manager chart and their default values.

| Parameter | Description | Default |
| --------- | ----------- | ------- |
| `replicaCount` |  | 1 |
| `image.repository` |  | "quay.io/sighup/permission-manager" |
| `image.pullPolicy` |  | "IfNotPresent" |
| `image.tag` |  | "1.8.0-rc1" |
| `imagePullSecrets` |  | [] |
| `nameOverride` |  | "" |
| `fullnameOverride` |  | "" |
| `serviceAccount.create` |  | true |
| `serviceAccount.annotations` |  | {} |
| `serviceAccount.name` |  | "" |
| `podAnnotations` |  | {} |
| `podSecurityContext.fsGroup` |  | 2000 |
| `securityContext` |  | {} |
| `service.type` |  | "ClusterIP" |
| `service.port` |  | 80 |
| `service.nodePort` |  | null |
| `ingress.enabled` |  | false |
| `ingress.annotations` |  | null |
| `ingress.hosts` |  | [{"host": "permission-manager.domain.com", "paths": [{"path": "/", "pathType": "ImplementationSpecific"}]}] |
| `resources` |  | {} |
| `autoscaling.enabled` |  | false |
| `autoscaling.minReplicas` |  | 1 |
| `autoscaling.maxReplicas` |  | 100 |
| `autoscaling.targetCPUUtilizationPercentage` |  | 80 |
| `nodeSelector` |  | {} |
| `tolerations` |  | [] |
| `affinity` |  | {} |
| `config.clusterName` |  | "" |
| `config.controlePlaneAddress` |  | "" |
| `config.basicAuthPassword` |  | "RrXwZSBdTXhQL6" |
| `config.templates` |  | [{"name": "operation", "apiGroups": ["*"], "resources": ["*"], "verbs": ["*"]}, {"name": "developer", "apiGroups": ["*"], "resources": ["configmaps", "endpoints", "persistentvolumeclaims", "pods", "pods/log", "pods/portforward", "podtemplates", "replicationcontrollers", "resourcequotas", "secrets", "services", "events", "daemonsets", "deployments", "replicasets", "ingresses", "networkpolicies", "poddisruptionbudgets"], "verbs": ["*"]}, {"name": "read-only", "apiGroups": ["*"], "resources": ["componentstatuses", "namespaces", "nodes", "persistentvolumes", "mutatingwebhookconfigurations", "validatingwebhookconfigurations", "customresourcedefinitions", "apiservices", "tokenreviews", "selfsubjectaccessreviews", "selfsubjectrulesreviews", "subjectaccessreviews", "certificatesigningrequests", "runtimeclasses", "podsecuritypolicies", "clusterrolebindings", "clusterroles", "priorityclasses", "csidrivers", "csinodes", "storageclasses", "volumeattachment"], "verbs": ["get", "list", "watch"]}, {"name": "admin", "apiGroups": ["*"], "resources": ["componentstatuses", "namespaces", "nodes", "persistentvolumes", "mutatingwebhookconfigurations", "validatingwebhookconfigurations", "customresourcedefinitions", "apiservices", "tokenreviews", "selfsubjectaccessreviews", "selfsubjectrulesreviews", "subjectaccessreviews", "certificatesigningrequests", "runtimeclasses", "podsecuritypolicies", "clusterrolebindings", "clusterroles", "priorityclasses", "csidrivers", "csinodes", "storageclasses", "volumeattachment"], "verbs": ["*"]}] |

