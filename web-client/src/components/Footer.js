import React from 'react'

export default function Footer() {
  return (
    <div style={{ background: '#2d3748' }} className="flex justify-center py-6">
      <a href="https://sighup.io" target="_blank" rel="noopener noreferrer">
        <img
          className="block w-auto h-8 opacity-25 hover:opacity-100"
          src="https://sighup.io/images/sighup-logo.svg"
          alt="sighup logor"
        />
      </a>
    </div>
  )
}
