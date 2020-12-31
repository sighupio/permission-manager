import {templateClusterResourceRolePrefix} from "../constants";
import uuid from "uuid";
import {ClusterRoleBinding, RoleBinding} from "../hooks/useRbac";

type MixedRoleBindings = RoleBinding | ClusterRoleBinding


interface NormalizedRoleBinding {
  template: string;
  namespace: string | 'ALL_NAMESPACES';
  name: string;
}

/**
 * normalized rolebindings. This is required because clusterRoleBindings do not have namespace
 * @see ClusterRoleBinding
 * @see RoleBinding
 */
export interface AggregatedRoleBinding {
  /**
   * uuid v4
   */
  id: string,
  /**
   * contains a list of the namespace or 'ALL_NAMESPACES'
   */
  namespaces: string[] | 'ALL_NAMESPACES'
  /**
   * example: template-namespaced-resources___developer
   */
  template: string
}


export interface ExtractedUserRoles {
  rbs: RoleBinding[],
  crbs: ClusterRoleBinding[],
  extractedPairItems: AggregatedRoleBinding[]
}

/**
 *  A function that encapsulates the common logic to extract the roles of a given user
 * @param roleBindings
 * @param clusterRoleBindings
 * @param username
 */
export function extractUsersRoles(roleBindings: RoleBinding[], clusterRoleBindings: ClusterRoleBinding[], username: string): ExtractedUserRoles {
  const rbs = (roleBindings || []).filter(rb => {
    return rb.metadata.name.startsWith(username)
  })
  
  const crbs = (clusterRoleBindings || []).filter(crb => {
    return crb.metadata.name.startsWith(username)
  })
  
  const normalizedRoleBindings: NormalizedRoleBinding[] = [...rbs, ...crbs]
    .filter(
      crb => !crb.metadata.name.includes(templateClusterResourceRolePrefix)
    )
    .map(v => {
      const mixedRoleBinding: MixedRoleBindings = v
      const name = mixedRoleBinding.metadata.name
      const template = mixedRoleBinding.roleRef.name
      const namespace = mixedRoleBinding.metadata['namespace'] || 'ALL_NAMESPACES'
      return {template, namespace, name}
    })
  
  //todo try to understand
  const extractedPairItems: AggregatedRoleBinding[] = normalizedRoleBindings.reduce((acc, item) => {
    const has = acc.find(x => x.template === item.template)
    
    if (has) {
      if (has.namespaces !== 'ALL_NAMESPACES') {
        if (item.namespace === 'ALL_NAMESPACES') {
          has.namespaces = 'ALL_NAMESPACES'
        } else {
          has.namespaces.push(item.namespace)
        }
      }
    } else {
      acc.push({
        id: uuid.v4(),
        namespaces: item.namespace === 'ALL_NAMESPACES' ? 'ALL_NAMESPACES' : [item.namespace],
        template: item.template
      })
    }
    
    return acc
  }, [])
  
  return {rbs, crbs, extractedPairItems};
}
