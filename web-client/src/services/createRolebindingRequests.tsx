import {templateClusterResourceRolePrefix} from "../constants";
import {httpClient} from "./httpClient";
import {ClusterAccess} from "../components/types";
import {AxiosInstance, AxiosResponse} from "axios";
import {AggregatedRoleBinding} from "./role";
import {Subject} from "../hooks/useRbac";


interface HasTemplateUsername {
  /**
   * rolename
   */
  readonly roleName: string,
  /**
   * this field adds generated_for_user to the http request
   */
  readonly username?: string,
}

interface CreateClusterRoleBindingParameters extends  HasTemplateUsername {
  readonly subjects: Subject[]
  readonly clusterRolebindingName: string
}

interface CreateClusterRolebindingParameters extends  HasTemplateUsername {
  readonly clusterRolebindingName: string
  readonly subjects: Subject[]
}


interface CreateRolebindingParameters extends  HasTemplateUsername {
  readonly namespace: string,
  readonly roleBindingName: string
  readonly subjects: Subject[]
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
  
  private getRoleName(clusterAccess: ClusterAccess): string {
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
      roleName: params.roleName,
      subjects: params.subjects,
      clusterRolebindingName: params.clusterRolebindingName
    };
    
    if (params.username) {
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
    

    return await this.httpCreateClusterRolebinding({
      clusterRolebindingName: params.clusterRolebindingName,
      roleName: params.roleName,
      username: params.username,
      subjects: params.subjects
    })
    
  }
  
  /**
   * create a namespaced rolebinding
   * @param params
   */
  public async rolebinding(params: CreateRolebindingParameters) {
    const request = {
      roleName: params.roleName,
      namespace: params.namespace,
      roleKind: 'ClusterRole',
      subjects: params.subjects,
      roleBindingName: params.roleBindingName
    };
    
    if (params.username) {
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
  public async createFromAggregatedRolebindings(params: CreateAllRolebindingsParameters) {
    /**
     * templates already sent to the backend
     */
    const consumed: string[] = []
    const subjects: Subject[] = [
      {
        kind: 'ServiceAccount',
        name: params.username,
        namespace: 'permission-manager'
      }
    ]
    
    // we grab all the 'ALL_NAMESPACE' rolebindings and create them on the backend
    for (const allNamespaceRolebinding of params.aggregatedRoleBindings.filter(e => e.namespaces === 'ALL_NAMESPACES')) {
      const clusterRolebindingName = params.username + '___' + allNamespaceRolebinding.roleName + 'all_namespaces'
      
      if (!consumed.includes(clusterRolebindingName)) {
        
        await this.rolebindingAllNamespaces({
          clusterRolebindingName: clusterRolebindingName,
          // addGeneratedForUser: false,
          roleName: allNamespaceRolebinding.roleName,
          // username: params.username,
          subjects: subjects
        })
        
        consumed.push(clusterRolebindingName)
      }
    }
    
    // we grab all the namespaced rolebinding and create them on the backend
    for (const namespacedRoleBinding of params.aggregatedRoleBindings.filter(e => e.namespaces !== 'ALL_NAMESPACES')) {
      for (const namespace of namespacedRoleBinding.namespaces) {
        
        const rolebindingName = params.username + '___' + namespacedRoleBinding.roleName + '___' + namespace
        
        if (!consumed.includes(rolebindingName)) {
          await this.rolebinding({
            roleName: namespacedRoleBinding.roleName,
            username: params.username,
            namespace: namespace,
            roleBindingName: rolebindingName,
            subjects: subjects
          });
          
          consumed.push(rolebindingName)
        }
      }
    }
    
    // we create the clusterRoleBinding
    
    // none takes no action in resource creation
    if (params.clusterAccess === 'none') {
      return;
    }
    
    const roleName = params.username + '___' + this.getRoleName(params.clusterAccess);
    
    const clusterRolebindingName = params.username + '___' + roleName
    
    //todo this must be changed in the future to support dynamic cluster roles. Right now it's just a single api call based on a radio select
    await this.clusterRolebinding({
      roleName: roleName,
      clusterRolebindingName: clusterRolebindingName,
      // username: params.username,
      // addGeneratedForUser: false,
      subjects: subjects
    });
    
  }
}

//todo in future remove the singleton
export const rolebindingCreateRequests = new RolebindingCreateRequests(httpClient);
