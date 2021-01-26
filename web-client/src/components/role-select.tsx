import React, {useEffect, useState} from 'react'
import {Role, useRbac} from '../hooks/useRbac'

interface RoleSelectParameters {
  /**
   * sets a role
   * @param callback
   */
  onSelected(callback: Role): void
}
export function RoleSelect({ onSelected }: RoleSelectParameters) {
  const { refreshRbacData, roles } = useRbac()
  const [roleName, setRoleName] = useState('')

  useEffect(() => {
    if (roles.length > 0 && roleName !== '') {
      onSelected(roles.find(r => r.metadata.name === roleName))
    }
  }, [onSelected, roleName, roles])

  useEffect(() => {
    if (roles.length > 0 && roleName === '') {
      onSelected(roles[0])
    }
  }, [onSelected, roleName, roles])

  return (
    <div>
      <label>
        role
        <select value={roleName} onChange={e => setRoleName(e.target.value)}>
          {roles.map(r => {
            return (
              <option key={r.metadata.name} value={r.metadata.name}>
                {r.metadata.name}
              </option>
            )
          })}
        </select>
        <button type="button" onClick={refreshRbacData}>
          refresh roles
        </button>
      </label>
    </div>
  )
}
