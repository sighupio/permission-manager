import React from 'react'
import {Link} from 'react-router-dom'

export default function Header() {
  return (
    <nav className="flex items-center justify-between flex-wrap bg-teal-500 p-6">
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <span className="font-semibold text-xl tracking -tight">
          Permissions Manager
        </span>
      </div>
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="flex  lg:flex-grow">
          <div className="text-sm">
            <Link
              to="/"
              className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"
            >
              users
            </Link>
          </div>
          {/* <div className="text-sm ml-2">
            <Link
              to="/advanced"
              className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"
            >
              advanced
            </Link>
          </div> */}
        </div>
        <div>
          <Link
            to="/new-user"
            className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-500 hover:bg-white mt-4 lg:mt-0"
          >
            Create New User
          </Link>
        </div>
      </div>
    </nav>
  )
}
