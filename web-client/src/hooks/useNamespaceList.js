import { useState, useEffect } from 'react'
import axios from 'axios'

export function useNamespaceList() {
  const [namespaceList, setNamespaceList] = useState([])
  useEffect(() => {
    let unmounted = false

    axios.get('/api/list-namespace').then(res => {
      if (!unmounted) setNamespaceList(res.data.namespaces)
    })

    return () => {
      unmounted = true
    }
  }, [])

  return { namespaceList }
}
