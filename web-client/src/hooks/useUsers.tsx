import React, {useState, useEffect, useContext, createContext} from 'react'
import {httpClient} from '../services/httpClient'
import {User} from "../types";

interface UserProvider {
  readonly users: User[];
  
  addUser({name}: { name: string }): void;
  
  removeUser({id}: { id: string }): void;
  
  refreshUsers(): void;
  
  readonly loading: boolean;
  
  readonly loaded: boolean;
}


function useUsersFromApi(): UserProvider {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  
  function fetchUsers(): void {
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
  
  function addUser({name}: { name: string }): void {
    httpClient.post('/api/create-user', {name}).then(res => {
      fetchUsers()
    })
  }
  
  function removeUser({id}: { id: string }): void {
    httpClient.post('/api/delete-user', {id}).then(res => {
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

export const UsersProvider = ({children}) => {
  return (
    <UsersContext.Provider value={useUsersFromApi()}>
      {children}
    </UsersContext.Provider>
  )
}


export function useUsers(): UserProvider {
  return useContext(UsersContext)
}
