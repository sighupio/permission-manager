import {templateClusterResourceRolePrefix} from "../constants";
import {httpClient} from "./httpClient";
import {ClusterAccess} from "../components/types";
import {AxiosInstance, AxiosResponse} from "axios";
import {AggregatedRoleBinding} from "./role";

interface HasAddGeneratedUser {
  /**
   * this field adds generated_for_user to the http request
   */
  readonly addGeneratedForUser: boolean
}

interface HasTemplateUsername {
  readonly template: string,
  readonly username: string,
}

interface CreateClusterRoleBindingParameters extends HasAddGeneratedUser, HasTemplateUsername {
  readonly clusterRolebindingName: string
}

interface CreateClusterRolebindingParameters extends HasAddGeneratedUser {
  readonly clusterAccess: ClusterAccess,
  readonly username: string
  
}


interface CreateRolebindingParameters extends HasAddGeneratedUser, HasTemplateUsername {
  readonly namespace: string,
  readonly roleBindingName: string
}

interface CreateAllRolebindingsParameters {
  readonly aggregatedRoleBindings: AggregatedRoleBinding[],
  readonly username: string,
  readonly clusterAccess: ClusterAccess
}

/**
 * This class contains all the httpRequests for the clusterRoleBinding, roleBinding creation.
 */
class RolebindingCreateRequests {
  
  
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
  public async clusterRolebinding(params: CreateClusterRolebindingParameters): Promise<AxiosResponse<any>> {
    
    // none takes no action in resource creation
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
  
  /**
   * create a namespaced rolebinding
   * @param params
   */
  public async rolebinding(params: CreateRolebindingParameters) {
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
      roleBindingName: params.roleBindingName
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
  public async rolebindingAllNamespaces(params: CreateClusterRoleBindingParameters) {
    
    return await this.httpCreateClusterRolebinding(params)
  }
  
  /**
   * Handles the creation of:
   * a) ClusterRoleBindings
   * b) Rolebindings
   * @param params
   */
  public async allRolebindingsType(params: CreateAllRolebindingsParameters) {
    /**
     * templates already sent to the backend
     */
    const consumed: string[] = []
    
    // we grab all the 'ALL_NAMESPACE' rolebindings and create them on the backend
    for (const allNamespaceRolebinding of params.aggregatedRoleBindings.filter(e => e.namespaces === 'ALL_NAMESPACES')) {
      const clusterRolebindingName = params.username + '___' + allNamespaceRolebinding.template + 'all_namespaces'
      
      if (!consumed.includes(clusterRolebindingName)) {
        
        await this.rolebindingAllNamespaces({
          clusterRolebindingName: clusterRolebindingName,
          addGeneratedForUser: false,
          template: allNamespaceRolebinding.template,
          username: params.username
        })
        
        consumed.push(clusterRolebindingName)
      }
    }
    
    // we grab all the namespaced rolebinding and create them on the backend
    for (const namespacedRoleBinding of params.aggregatedRoleBindings.filter(e => e.namespaces !== 'ALL_NAMESPACES')) {
      for (const namespace of namespacedRoleBinding.namespaces) {
        
        const rolebindingName = params.username + '___' + namespacedRoleBinding.template + '___' + namespace
        
        if (!consumed.includes(rolebindingName)) {
          await this.rolebinding({
            template: namespacedRoleBinding.template,
            username: params.username,
            namespace: namespace,
            roleBindingName: rolebindingName,
            addGeneratedForUser: true
          });
          
          consumed.push(rolebindingName)
        }
      }
    }
    
    // we create the clusterRoleBinding
    //todo this must be changed in the future to support dynamic cluster roles. Right now it's just a single api call based on a radio select
    await this.clusterRolebinding({
      clusterAccess: params.clusterAccess,
      username: params.username,
      addGeneratedForUser: false
    });
    
  }
}

//todo in future remove the singleton
export const rolebindingCreateRequests = new RolebindingCreateRequests(httpClient);
