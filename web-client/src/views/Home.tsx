import React from 'react'
import {useUsers} from '../hooks/useUsers'
import {Link} from 'react-router-dom'

export default function Home() {
  const { users, loading, loaded } = useUsers()

  return (
    <div className=" bg-gray-200  pt-16">
      <div className="max-w-3xl mx-auto">
        <div className=" bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
          <h2 className="text-3xl mb-4 text-gray-800">Users</h2>
          <ul className="list-disc pl-6 ">
            {loading
              ? '...loading'
              : loaded && users.length === 0
              ? 'no users'
              : users.map(u => {
                  return (
                    <li key={u.name}>
                      <Link to={`/users/${u.name}`} className="underline">
                        {u.name}
                      </Link>
                    </li>
                  )
                })}
          </ul>
        </div>
        <div className="mt-2">
          <Link to="/new-user">
            <button className="bg-transparent hover:bg-teal-500 text-teal-700 font-semibold hover:text-white py-2 px-4 border border-teal-500 hover:border-transparent rounded">
              Create New User
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
