import {resourceSeparator, templateClusterResourceRolePrefix} from "../constants";
import uuid from "uuid";
import {ClusterRoleBinding, RoleBinding} from "../hooks/useRbac";

type MixedRoleBindings = RoleBinding | ClusterRoleBinding


interface NormalizedRoleBinding {
  readonly template: string;
  readonly namespace: string | 'ALL_NAMESPACES';
  readonly name: string;
}

/**
 * contains a list of the namespace or 'ALL_NAMESPACES'
 */
export type AggregatedRoleBindingNamespace = string[] | "ALL_NAMESPACES"

/**
 * normalized rolebindings. This is required because clusterRoleBindings do not have namespace
 * @see ClusterRoleBinding
 * @see RoleBinding
 */
export interface AggregatedRoleBinding {
  /**
   * uuid v4
   */
  readonly id: string,
  
  readonly namespaces: AggregatedRoleBindingNamespace
  /**
   * example: template-namespaced-resources___developer
   */
  readonly roleName: string
}


export interface ExtractedUserRoles {
  readonly rbs: RoleBinding[],
  readonly crbs: ClusterRoleBinding[],
  readonly extractedPairItems: AggregatedRoleBinding[]
}

/**
 * extractUsersRoles encapsulates the common logic needed to extract the roles of a given user
 * @param roleBindings
 * @param clusterRoleBindings
 * @param username
 */
export function extractUsersRoles(roleBindings: RoleBinding[], clusterRoleBindings: ClusterRoleBinding[], username: string): ExtractedUserRoles {
  const rbs = (roleBindings || []).filter(rb => {
    const name = rb.metadata.name.split(resourceSeparator).find(e => e);
    
    if (!name) return false
    
    return name === username
  })
  
  const crbs = (clusterRoleBindings || []).filter(crb => {
    const name = crb.metadata.name.split(resourceSeparator).find(e => e);
    
    if (!name) return false
    
    return name[0] === username
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
