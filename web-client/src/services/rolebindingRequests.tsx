import {templateClusterResourceRolePrefix} from "../constants";
import {httpClient} from "./httpClient";
import {ClusterAccess} from "../components/types";
import {AxiosInstance, AxiosResponse} from "axios";

interface HasAddGeneratedUser {
  readonly addGeneratedForUser: boolean
  
}

interface CreateClusterRoleBindingParameters extends HasAddGeneratedUser {
  readonly template: string,
  readonly username: string,
  readonly clusterRolebindingName: string
}

interface CreateClusterRolebindingParameters extends HasAddGeneratedUser {
  readonly clusterAccess: ClusterAccess,
  readonly username: string
  
}


interface CreateClusterRolebindingNamespacedParameters extends HasAddGeneratedUser {
  readonly template: string,
  readonly username: string,
  readonly namespace: string,
  readonly roleBindingName: string
}

/**
 * This class contains all the httpRequests for the clusterRoleBinding, roleBinding creation.
 */
class RolebindingRequests {
  
  
  constructor(private readonly httpClient: AxiosInstance) {
  }
  
  private getTemplateName(clusterAccess: ClusterAccess): string {
    switch (clusterAccess) {
      case "none":
        throw new Error("case 'none' not supported");
      case "read":
        return templateClusterResourceRolePrefix + 'read-only';
      case "write":
        return templateClusterResourceRolePrefix + 'admin';
      default:
        throw new Error(`unrecognized case: ${clusterAccess}`)
      
    }
  }
  
  /**
   * executes and encapsulates the common logic for the http requests towards the '/api/create-cluster-rolebinding' endpoint.
   *
   * @param params
   */
  private async httpCreateClusterRolebinding(params: CreateClusterRoleBindingParameters) {
    const request = {
      roleName: params.template,
      subjects: [
        {
          kind: 'ServiceAccount',
          name: params.username,
          namespace: 'permission-manager'
        }
      ],
      clusterRolebindingName: params.clusterRolebindingName
    };
    
    if (params.addGeneratedForUser) {
      request['generated_for_user'] = params.username
    }
    
    return await this.httpClient.post('/api/create-cluster-rolebinding', request)
  }
  
  /**
   * this is used to create a clusterRolebinding from clusterAccess enum
   * @see ClusterAccess
   * @param params
   */
  public async createClusterRolebinding(params: CreateClusterRolebindingParameters): Promise<AxiosResponse<any>> {
    if (params.clusterAccess === 'none') {
      return;
    }
    
    const template = this.getTemplateName(params.clusterAccess);
    
    const clusterRolebindingName = params.username + '___' + template
    
    return await this.httpCreateClusterRolebinding({
      addGeneratedForUser: params.addGeneratedForUser,
      clusterRolebindingName: clusterRolebindingName,
      template: template,
      username: params.username
    })
    
  }
  
  public async createRolebinding(params: CreateClusterRolebindingNamespacedParameters) {
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
    
    if (params.addGeneratedForUser) {
      request['generated_for_user'] = params.username
    }
    
    await this.httpClient.post('/api/create-rolebinding', request)
  }
  
  /**
   * ALL_NAMESPACES rolebinding creates a cluster-rolebinding in kubernetes
   * @param params
   */
  public async createRolebindingAllNamespaces(params: CreateClusterRoleBindingParameters) {
    
    return await this.httpCreateClusterRolebinding(params)
  }
}

//todo in future remove the singleton
export const httpRolebindingRequests = new RolebindingRequests(httpClient);
