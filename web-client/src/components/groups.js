import React, { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import { useUsers } from '../hooks/useUsers'

export default function Groups() {
  const { groups, addGroup, removeGroup } = useGroups()
  const { refreshUsers } = useUsers()
  return (
    <div>
      <h1 style={{ padding: 20, margin: 30, background: 'pink' }}>groups</h1>
      <div style={{ padding: 20, margin: 30, background: 'pink' }}>
        <NewGroupForm
          onSubmit={formValues => addGroup({ name: formValues.name })}
        />
        <ul>
          {groups.map(u => {
            return (
              <li key={u.id}>
                {u.name}{' '}
                <button
                  onClick={async () => {
                    await removeGroup({ id: u.id })
                    refreshUsers()
                  }}
                >
                  delete
                </button>
                <ul>
                  {u.users.map(user => {
                    return <li key={user.id}>{user.name}</li>
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function NewGroupForm({ onSubmit }) {
  const [name, setName] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit({ name })
        setName('')
      }}
    >
      <h2> new group</h2>
      <label>
        name
        <input
          value={name}
          required
          onChange={e => setName(e.target.value)}
        ></input>
      </label>
      <button type="submit">submit</button>
    </form>
  )
}
