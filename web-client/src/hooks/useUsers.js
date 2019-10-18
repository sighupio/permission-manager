import React, { useState, useEffect, useContext, createContext } from 'react'
import axios from 'axios'
import { useGroups } from './useGroups'

function useUsersFromApi() {
  const [users, setUsers] = useState([])
  const { refreshGroups } = useGroups()

  function fetchUsers() {
    axios.get('/api/list-users').then(res => {
      setUsers(res.data)
    })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  function addUser({ name, groups }) {
    axios.post('/api/create-user', { name, groups }).then(res => {
      fetchUsers()
      refreshGroups()
    })
  }

  function removeUser({ id }) {
    axios.post('/api/delete-user', { id }).then(res => {
      fetchUsers()
      refreshGroups()
    })
  }

  return { users, addUser, removeUser, refreshUsers: fetchUsers }
}

const UsersContext = createContext(null)

export const UsersProvider = ({ children }) => {
  return (
    <UsersContext.Provider value={useUsersFromApi()}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  return useContext(UsersContext)
}
