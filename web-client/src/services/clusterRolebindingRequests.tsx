import {templateClusterResourceRolePrefix} from "../constants";
import {httpClient} from "./httpClient";
import {ClusterAccess} from "../components/types";
import {AxiosResponse} from "axios";


function getTemplateName(clusterAccess: ClusterAccess): string {
  switch (clusterAccess) {
    case "none":
      throw new Error("case 'none' not supported");
    case "read":
      return templateClusterResourceRolePrefix + 'read-only';
    case "write":
      return templateClusterResourceRolePrefix + 'admin';
    
  }
  
}

export async function createClusterRolebindingNotNamespaced(clusterAccess: ClusterAccess, username: string): Promise<AxiosResponse<any>> {
  if (clusterAccess === 'none') {
    return;
  }
  
  const template = getTemplateName(clusterAccess);
  
  const clusterRolebindingName = username + '___' + template
  
  return await httpClient.post('/api/create-cluster-rolebinding', {
    roleName: template,
    subjects: [
      {
        kind: 'ServiceAccount',
        name: username,
        namespace: 'permission-manager'
      }
    ],
    clusterRolebindingName: clusterRolebindingName
  })
  
}

interface CreateClusterRolebindingNamespacedParameters {
  readonly template: string,
  readonly username: string,
  readonly namespace: string,
  readonly roleBindingName: string
  readonly addGeneratedForUser: boolean
}

export async function createClusterRolebindingNamespaced(params: CreateClusterRolebindingNamespacedParameters) {
  const request = {
    roleName: params.template,
    namespace: params.namespace,
    roleKind: 'ClusterRole',
    subjects: [
      {
        kind: 'ServiceAccount',
        name: params.username,
        namespace: 'permission-manager'
      }
    ],
    clusterRolebindingName: params.roleBindingName
  };
  
  if(params.addGeneratedForUser) {
    request['generated_for_user'] = params.username
  }
  
  await httpClient.post('/api/create-rolebinding', request)
}
