import React, {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {httpClient} from '../services/httpClient'

/**
 * Kubernetes metadata fields.
 */
interface Metadata {
  
  annotations: { [key: string]: string }
  creationTimestamp: string
  labels: { [key: string]: string }
  managedFields: object[]
  name: string
  resourceVersion: string
  selfLink: string
  uid: string
}

/**
 * Metadata for a namespaced resource
 * @see Metadata
 */
interface MetadataNamespacedResource extends Metadata {
  namespace: string
}

export interface RoleRef {
  apiGroup: string
  kind: string
  name: string
}

export interface Subject {
  kind: string,
  apiGroup: string
  name: string
  namespace?: string
}

export interface Rule {
  apiGroups: string[]
  resources: string[]
  verbs: string[]
}

export interface RuleWithResourceNames extends Rule{
  resourceNames: string[]

}

export interface ClusterRoleBinding {
  metadata: Metadata
  roleRef: RoleRef
  subjects: Subject[]
}


export interface ClusterRole {
  aggregationRule?: {
    clusterRoleSelectors: {}[]
  }
  metadata: Metadata
  rules: Rule[]
}

export interface Role {
  metadata: MetadataNamespacedResource
  rules: RuleWithResourceNames[]
}

export interface RoleBinding {
  metadata: MetadataNamespacedResource
  roleRef: RoleRef
  subjects: Subject[]
}

/**
 * RbacProvider allow the client to load the Rbac data from kubernetes
 */
export interface RbacProvider {
  roles: Role[] | null
  roleBindings: RoleBinding[] | null
  clusterRoles: ClusterRole[] | null
  clusterRoleBindings: ClusterRoleBinding[] | null
  
  /**
   * requests the RbacProvider data again
   */
  refreshRbacData(): void
}



function useRbacFromApi(): RbacProvider {
  // this should be the same data that returns from the /api/rbac endpoint
  // todo why not set empty arrays instead of null?
  const [data, setData] = useState({
    roleBindings: null,
    roles: null,
    clusterRoleBindings: null,
    clusterRoles: null
  })
  
  const fetchData = useCallback(async function fetchData() {
    const {data} = await httpClient.get('/api/rbac')
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

export function useRbac(): RbacProvider {
  return useContext(RbacContext)
}
