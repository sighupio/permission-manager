import React, { useState, useEffect } from 'react'
import { useRbac } from '../hooks/useRbac'

export function RoleSelect ({ onSelected }) {
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
        <button type='button' onClick={refreshRbacData}>
          refresh roles
        </button>
      </label>
    </div>
  )
}
