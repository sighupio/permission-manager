import React, {useEffect, useState} from 'react'
import {useRbac} from '../../hooks/useRbac'

export function ClusterRoleSelect({ onSelected }) {
  
  const [hideSystemClusterRoles, setHideSystemClusterRoles] = useState<boolean>(true)
  const { refreshRbacData, clusterRoles } = useRbac()

  const [roleName, setRoleName] = useState('')

  useEffect(() => {
    if (clusterRoles.length > 0 && roleName !== '') {
      onSelected(clusterRoles.find(r => r.metadata.name === roleName))
    }
  }, [roleName, onSelected, clusterRoles])

  useEffect(() => {
    if (clusterRoles.length > 0 && roleName === '') {
      onSelected(clusterRoles[0])
    }
  }, [clusterRoles, onSelected, roleName])

  return (
    <div>
      <label>
        cluster role
        <select value={roleName} onChange={e => setRoleName(e.target.value)}>
          {clusterRoles
            .filter(r => {
              if (
                hideSystemClusterRoles &&
                r.metadata.name.startsWith('system:')
              ) {
                return false
              }
              return true
            })
            .map(r => {
              return (
                <option key={r.metadata.name} value={r.metadata.name}>
                  {r.metadata.name}
                </option>
              )
            })}
        </select>
        <div>
          <label>
            <small>
              hide system clusterRoles (role name starting with "system:")
            </small>
            <input
              type="checkbox"
              checked={hideSystemClusterRoles}
              onChange={e => setHideSystemClusterRoles(e.target.checked)}
            />
          </label>
        </div>
        <button type="button" onClick={refreshRbacData}>
          refresh cluster roles
        </button>
      </label>
    </div>
  )
}
