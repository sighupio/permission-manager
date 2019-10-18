import React from 'react'
import NewUserWizard from '../components/new-user-wizard'

export default function NewUser() {
  return (
    <div className="pt-16">
      <div className="max-w-3xl	mx-auto bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
        <NewUserWizard />
      </div>
    </div>
  )
}
