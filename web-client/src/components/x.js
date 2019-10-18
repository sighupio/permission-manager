import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default () => {
  const [data, setData] = useState()

  useEffect(() => {
    axios.get('/api/rbac').then(res => {
      setData(res.data)
    })
  }, [])

  if (!data) return <div>no data</div>

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div>
          <h1>roles</h1>
          {data.roles.map(r => {
            return (
              <div style={{ marginBottom: 20 }}>
                <div>name: {r.metadata.name}</div>
                <div>namespace: {r.metadata.namespace}</div>
                <div>raw: {JSON.stringify(r.rules)}</div>
              </div>
            )
          })}
        </div>

        <div>
          <h1>rolebindings</h1>
          {data.roleBindings.map(r => {
            return (
              <div style={{ marginBottom: 20 }}>
                <div>name: {r.metadata.name}</div>
                <div>namespace: {r.metadata.namespace}</div>
              </div>
            )
          })}
        </div>

        <div>
          <h1>clusterRoles</h1>
          {data.clusterRoles.map(r => {
            return (
              <div style={{ marginBottom: 20 }}>
                <div>name: {r.metadata.name}</div>
              </div>
            )
          })}
        </div>

        <div>
          <h1>clusterRoleBindings</h1>
          {data.clusterRoleBindings.map(r => {
            return (
              <div style={{ marginBottom: 20 }}>
                <div>name: {r.metadata.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
