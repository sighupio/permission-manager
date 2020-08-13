import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback
} from 'react'
import axios from 'axios'

function useRbacFromApi () {
  const [data, setData] = useState({
    roleBindings: null,
    roles: null,
    clusterRoleBindings: null,
    clusterRoles: null
  })

  const fetchData = useCallback(async function fetchData () {
    const { data } = await axios.get('/api/rbac')
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

export function useRbac () {
  return useContext(RbacContext)
}
