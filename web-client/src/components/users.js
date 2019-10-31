import React, { useState } from 'react'
import { useUsers } from '../hooks/useUsers'
import { useGroups } from '../hooks/useGroups'
import CreateKubeconfigButton from './CreateKubeconfigButton'

export default function Users() {
  const { users, addUser, removeUser } = useUsers()
  return (
    <div>
      <h1 style={{ padding: 20, margin: 30, background: 'lightblue' }}>
        users
      </h1>

      <div
        style={{
          padding: 20,
          margin: 30,
          background: 'lightblue',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3>Create from template</h3>
        <button>developer</button>
        <button>SRE</button>
        <button>namespace developer</button>
        <button>namespace contractor</button>
        <button>read-only admin</button>
        <button>admin</button>
        <button>namespace admin</button>
        <button>production read-only</button>
      </div>
      <div style={{ padding: 20, margin: 30, background: 'lightblue' }}>
        <NewUserForm
          onSubmit={formValues =>
            addUser({ name: formValues.name, groups: formValues.userGroups })
          }
        />
        <ul>
          {users.map(u => {
            return (
              <li key={u.id}>
                <div>{u.name}</div>
                <CreateKubeconfigButton user={u} />
                <button onClick={() => removeUser({ id: u.id })}>delete</button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function NewUserForm({ onSubmit }) {
  const [name, setName] = useState('')
  const { groups } = useGroups()
  const [userGroups, setUserGroups] = useState([])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit({ name, userGroups })
        setName('')
      }}
    >
      <h2> new user</h2>
      <label>
        name
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
        ></input>
      </label>

      <div>
        groups
        <ul>
          {groups.map(g => {
            return (
              <li key={g.id}>
                <label>
                  <input
                    type="checkbox"
                    onChange={e => {
                      if (e.target.checked) {
                        setUserGroups(state => [...state, g])
                      } else {
                        setUserGroups(state => state.filter(s => s.id !== g.id))
                      }
                    }}
                  />
                  {g.name}
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <button type="submit">submit</button>
    </form>
  )
}
