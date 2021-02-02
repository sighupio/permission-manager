import {templateClusterResourceRolePrefix} from "../constants";
import {ClusterAccess} from "../components/types";
import {AxiosInstance, AxiosResponse} from "axios";
import {AggregatedRoleBinding} from "./role";
import {Subject} from "../hooks/useRbac";


interface RolebindindingAttributes {
  /**
   * rolename
   */
  readonly roleName: string,
  /**
   * this field adds generated_for_user to the http request
   */
  readonly username?: string,
  readonly subjects: Subject[]
  
}


interface ClusterRolebindingCreate extends RolebindindingAttributes {
  readonly clusterRolebindingName: string
}


interface RolebindingCreate extends RolebindindingAttributes {
  readonly namespace: string,
  readonly roleBindingName: string
  readonly roleKind: string
}


/**
 * This class contains all the httpRequests for the clusterRoleBinding, roleBinding creation.
 */
export class RolebindingCreateRequests {
  
  
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
  private async httpCreateClusterRolebinding(params: ClusterRolebindingCreate) {
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
  public async clusterRolebinding(params: ClusterRolebindingCreate): Promise<AxiosResponse<any>> {
    
    
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
  public async rolebinding(params: RolebindingCreate) {
    const request = {
      roleName: params.roleName,
      namespace: params.namespace,
      roleKind: params.roleKind,
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
  public async rolebindingAllNamespaces(params: ClusterRolebindingCreate) {
    
    return await this.httpCreateClusterRolebinding(params)
  }
  

  /**
   * Handles the creation of:
   * a) ClusterRoleBindings
   * b) Rolebindings
   * @param aggregatedRoleBindings
   * @param username
   * @param clusterAccess
   */
  public async fromAggregatedRolebindings(aggregatedRoleBindings: AggregatedRoleBinding[], username: string, clusterAccess: ClusterAccess) {
    /**
     * templates already sent to the backend
     */
    const consumed: string[] = []
    const subjects: Subject[] = [
      {
        kind: 'ServiceAccount',
        name: username,
        namespace: 'permission-manager'
      }
    ]
    
    // we grab all the 'ALL_NAMESPACE' rolebindings and create them on the backend
    for (const allNamespaceRolebinding of aggregatedRoleBindings.filter(e => e.namespaces === 'ALL_NAMESPACES')) {
      const clusterRolebindingName = username + '___' + allNamespaceRolebinding.roleName + 'all_namespaces'
      
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
    for (const namespacedRoleBinding of aggregatedRoleBindings.filter(e => e.namespaces !== 'ALL_NAMESPACES')) {
      for (const namespace of namespacedRoleBinding.namespaces) {
        
        const rolebindingName = username + '___' + namespacedRoleBinding.roleName + '___' + namespace
        
        if (!consumed.includes(rolebindingName)) {
          await this.rolebinding({
            roleName: namespacedRoleBinding.roleName,
            username: username,
            namespace: namespace,
            roleBindingName: rolebindingName,
            subjects: subjects,
            roleKind: 'ClusterRole'
          });
          
          consumed.push(rolebindingName)
        }
      }
    }
    
    // we create the clusterRoleBinding
    
    // none takes no action in resource creation
    if (clusterAccess === 'none') {
      return;
    }
    
    const roleName = username + '___' + this.getRoleName(clusterAccess);
    
    const clusterRolebindingName = username + '___' + roleName
    
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
