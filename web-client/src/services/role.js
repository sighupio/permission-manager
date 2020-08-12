import { templateClusterResourceRolePrefix } from '../constants'
import uuid from 'uuid'

/**
 * A function that encapsulates the common logic to extract the roles of a given user
 * @param {array} roleBindings
 * @param {array} clusterRoleBindings
 * @param {string} username the name of the user
 */
export function extractUsersRoles (roleBindings, clusterRoleBindings, username) {
  const rbs = (roleBindings || []).filter(rb => {
    return rb.metadata.name.startsWith(username)
  })

  const crbs = (clusterRoleBindings || []).filter(crb => {
    return crb.metadata.name.startsWith(username)
  })

  const pairs = [...rbs, ...crbs]
    .filter(
      crb => !crb.metadata.name.includes(templateClusterResourceRolePrefix)
    )
    .map(v => {
      const name = v.metadata.name
      const template = v.roleRef.name
      const namespace = v.metadata.namespace || 'ALL_NAMESPACES'
      return { template, namespace, name }
    })

  const extractedPairItems = pairs.reduce((acc, item) => {
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
        namespaces:
                    item.namespace === 'ALL_NAMESPACES'
                      ? 'ALL_NAMESPACES'
                      : [item.namespace],
        template: item.template
      })
    }

    return acc
  }, [])
  return { rbs, crbs, extractedPairItems }
}
