import React, { useState, useEffect, useContext, createContext } from 'react'
import {httpClient} from '../services/httpClient'

function useUsersFromApi() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  function fetchUsers() {
    setLoading(true)
    httpClient.get('/api/list-users').then(res => {
      setLoading(false)
      setLoaded(true)
      setUsers(res.data)
    })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  function addUser({ name }) {
    httpClient.post('/api/create-user', { name }).then(res => {
      fetchUsers()
    })
  }

  function removeUser({ id }) {
    httpClient.post('/api/delete-user', { id }).then(res => {
      fetchUsers()
    })
  }

  return {
    users,
    addUser,
    removeUser,
    refreshUsers: fetchUsers,
    loading,
    loaded
  }
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
