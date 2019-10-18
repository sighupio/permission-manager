import React from 'react'
import Roles from '../components/roles'
import ClusterRoles from '../components/cluster-roles'
import RoleBindings from '../components/rolebindings'
import ClusterRoleBindings from '../components/cluster-rolebindings'
import Groups from '../components/groups'
import Users from '../components/users'

export default function Advanced() {
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <ClusterRoles />
        <ClusterRoleBindings />
        <Roles />
        <RoleBindings />
        <Groups />
        <Users />
      </div>
    </div>
  )
}
