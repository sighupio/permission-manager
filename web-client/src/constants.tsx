export const RESOURCE_TYPES_NAMESPACED = [
  'bindings',
  'configmaps',
  'endpoints',
  'limitranges',
  'persistentvolumeclaims',
  'pods',
  'podtemplates',
  'replicationcontrollers',
  'resourcequotas',
  'secrets',
  'serviceaccounts',
  'services',
  'controllerrevisions',
  'statefulsets',
  'localsubjectaccessreviews',
  'horizontalpodautoscalers',
  'cronjobs',
  'jobs',
  'leases',
  'events',
  'daemonsets',
  'deployments',
  'replicasets',
  'ingresses',
  'networkpolicies',
  'poddisruptionbudgets',
  'rolebindings',
  'roles',
]
export const RESOURCE_TYPES_NON_NAMESPACED = [
  'componentstatuses',
  'namespaces',
  'nodes',
  'persistentvolumes',
  'mutatingwebhookconfigurations',
  'validatingwebhookconfigurations',
  'customresourcedefinitions',
  'apiservices',
  'tokenreviews',
  'selfsubjectaccessreviews',
  'selfsubjectrulesreviews',
  'subjectaccessreviews',
  'certificatesigningrequests',
  'runtimeclasses',
  'podsecuritypolicies',
  'clusterrolebindings',
  'clusterroles',
  'priorityclasses',
  'csidrivers',
  'csinodes',
  'storageclasses',
  'volumeattachment',
]

export const VERBS = [
  'get',
  'list',
  'watch',
  'create',
  'update',
  'patch',
  'delete',
]

export const resourceSeparator = '___'

export const templateNamespacedResourceRolePrefix = 'template-namespaced-resources' + resourceSeparator

export const templateClusterResourceRolePrefix = 'template-cluster-resources' + resourceSeparator

