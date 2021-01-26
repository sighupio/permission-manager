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

export async function createClusterRolebinding(clusterAccess: ClusterAccess, username: string): Promise<AxiosResponse<any>> {
  if (clusterAccess === 'none') {
    return;
  }
  
  const template = getTemplateName(clusterAccess);
  
  const clusterRolebindingName = username + '___' + template
  
  return await httpClient.post('/api/create-cluster-rolebinding', {
    generated_for_user: username,
    roleName: template,
    subjects: [
      {
        kind: 'ServiceAccount',
        name: username,
        namespace: 'permission-manager'
      }
    ],
    clusterRolebindingName
  })
  
}
