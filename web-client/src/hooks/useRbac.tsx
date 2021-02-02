import React, {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {httpClient} from '../services/httpClient'

/**
 * Kubernetes metadata fields.
 */
interface Metadata {
  
  readonly annotations: { [key: string]: string }
  readonly creationTimestamp: string
  readonly labels: { [key: string]: string }
  readonly managedFields: object[]
  readonly name: string
  readonly resourceVersion: string
  readonly selfLink: string
  readonly uid: string
}

/**
 * Metadata for a namespaced resource
 * @see Metadata
 */
interface MetadataNamespacedResource extends Metadata {
  readonly namespace: string
}

export interface RoleRef {
  readonly apiGroup: string
  readonly kind: string
  readonly name: string
}

export interface Subject {
  readonly kind: string,
  readonly apiGroup?: string
  readonly name: string
  readonly namespace?: string
}

export interface Rule {
  readonly apiGroups: string[]
  readonly resources: string[]
  readonly verbs: string[]
}

export interface RuleWithResourceNames extends Rule {
  readonly  resourceNames: string[]
  
}

export interface ClusterRoleBinding {
  readonly metadata: Metadata
  readonly roleRef: RoleRef
  readonly subjects: Subject[]
}


export interface ClusterRole {
  readonly aggregationRule?: {
    readonly clusterRoleSelectors: {}[]
  }
  readonly metadata: Metadata
  readonly rules: Rule[]
}

export interface Role {
  readonly metadata: MetadataNamespacedResource
  readonly rules: RuleWithResourceNames[]
}

export interface RoleBinding {
  readonly metadata: MetadataNamespacedResource
  readonly roleRef: RoleRef
  readonly subjects: Subject[]
}

/**
 * RbacProvider allow the client to load the Rbac data from kubernetes
 */
export interface RbacProvider {
  readonly roles: Role[] | null
  readonly roleBindings: RoleBinding[] | null
  readonly clusterRoles: ClusterRole[] | null
  readonly clusterRoleBindings: ClusterRoleBinding[] | null
  
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
