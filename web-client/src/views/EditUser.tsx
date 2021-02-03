import React, {useEffect} from 'react'
import EditUser from '../components/edit-user'
import CreateKubeconfigButton from '../components/CreateKubeconfigButton'
import {useUsers} from '../hooks/useUsers'
import {useParams} from 'react-router-dom'

export default function UserPage() {
  
  const { username }: {username: string} = useParams()
  
  const { users, refreshUsers } = useUsers()

  useEffect(refreshUsers, [])

  const user = users.find(u => u.name === username)

  return (
    <div className=" bg-gray-200  pt-16">
      <div className="max-w-3xl mx-auto">
        <div className=" bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
          {user ? <EditUser user={user} /> : 'loading user...'}
        </div>

        <div className="pb-8">
          <div className="mt-2">
            {user ? <CreateKubeconfigButton user={user} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
