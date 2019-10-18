import React from 'react'
import { useState, useEffect, createContext, useContext } from 'react'
import axios from 'axios'

function useGroupsFromApi() {
  const [groups, setGroups] = useState([])

  function fetchGroups() {
    axios.get('/api/list-groups').then(res => {
      setGroups(res.data)
    })
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  function addGroup({ name }) {
    axios.post('/api/create-group', { name, groups }).then(res => {
      fetchGroups()
    })
  }

  function removeGroup({ id }) {
    axios.post('/api/delete-group', { id }).then(res => {
      fetchGroups()
    })
  }
  return { groups, addGroup, removeGroup, refreshGroups: fetchGroups }
}

export const GroupsContext = createContext(null)

export const GroupsProvider = props => {
  return (
    <GroupsContext.Provider value={useGroupsFromApi()}>
      {props.children}
    </GroupsContext.Provider>
  )
}

export function useGroups() {
  return useContext(GroupsContext)
}
