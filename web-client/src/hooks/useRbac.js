import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback
} from 'react'
import {httpClient} from '../services/httpClient'

function useRbacFromApi() {
  // this should be the same data that returns from the /api/rbac endpoint
  const [data, setData] = useState({
    roleBindings: null,
    roles: null,
    clusterRoleBindings: null,
    clusterRoles: null
  })

  const fetchData = useCallback(async function fetchData() {
    const { data } = await httpClient.get('/api/rbac')
    //sets the data with the response
    setData(data)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    roles: data.roles,
    roleBindings: data.roleBindings,
    clusterRoles: data.clusterRoles,
    clusterRoleBindings: data.clusterRoleBindings,
    refreshRbacData: fetchData
  }
}

const RbacContext = createContext(null)

export const RbacProvider = props => {
  return (
    <RbacContext.Provider value={useRbacFromApi()}>
      {props.children}
    </RbacContext.Provider>
  )
}

export function useRbac() {
  return useContext(RbacContext)
}
