import {useState, useEffect} from 'react'
import {httpClient} from '../services/httpClient'

export interface Namespace {
  metadata: {
    name: string
  };
}

export interface NamespaceProvider {
  namespaceList: Namespace[]
}

export function useNamespaceList(): NamespaceProvider {
  const [namespaceList, setNamespaceList] = useState([])
  useEffect(() => {
    let unmounted = false
    
    httpClient.get('/api/list-namespace').then(res => {
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
