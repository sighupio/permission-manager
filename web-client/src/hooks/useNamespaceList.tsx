import {useEffect, useState} from 'react'
import {httpRequests} from "../services/httpRequests";

export interface Namespace {
  metadata: {
    name: string
  };
}

/**
 * NamespaceProvider allows the client to load the list of namespaces from kubernetes
 */
export interface NamespaceProvider {
  namespaceList: Namespace[]
}

export function useNamespaceList(): NamespaceProvider {
  const [namespaceList, setNamespaceList] = useState([])
  useEffect(() => {
    let unmounted = false
    
    httpRequests.namespaceList().then(res => {
      if (!unmounted)
        setNamespaceList(
          res.data.namespaces.map(ns => {
            /* to temporary handle api refactoring  */
            return {
              metadata: {
                name: ns
              }
            }
          })
        )
    })
    
    return () => {
      unmounted = true
    }
  }, [])
  
  return {namespaceList}
}
