import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Dialog } from '@reach/dialog'
import Editor from 'react-simple-code-editor'

export default function CreateKubeconfigButton({ user }) {
  const [showModal, setShowModal] = useState(false)
  const [kubeconfig, setKubeconfig] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (showModal && kubeconfig === '') {
      axios
        .post('/api/create-kubeconfig', {
          username: user.name, namespace: "default"
        })
        .then(({ data }) => {
          setKubeconfig(data.kubeconfig)
        })
    }
  }, [kubeconfig, showModal, user.name])

  return (
    <span>
      <Dialog
        className="max-w-4xl	mx-auto bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4"
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
      >
        <div>
          <div>
            <div className="flex justify-between">
              <h2 className="text-3xl mb-4 text-gray-800">
                kubeconfig for {user.name}
              </h2>
              <button
                className="text-lg close-button"
                onClick={() => setShowModal(false)}
              >
                <span aria-hidden>×</span>
              </button>
            </div>

            <div className="flex flex-row-reverse w-full mb-2">
              <button
                className="bg-transparent hover:bg-teal-500 text-teal-700 font-semibold hover:text-white py-2 px-4 border border-teal-500 hover:border-transparent rounded"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(kubeconfig).then(
                    function() {
                      setCopied(true)
                      console.log('Async: Copying to clipboard was successful!')
                    },
                    function(err) {
                      console.error('Async: Could not copy text: ', err)
                    }
                  )
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {kubeconfig ? (
              <div data-testid="yaml">
                <Editor
                  autoFocus
                  onValueChange={code => code}
                  value={kubeconfig}
                  highlight={code => code}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12
                  }}
                />
              </div>
            ) : (
              '...loading'
            )}
          </div>
        </div>
      </Dialog>
      <button
        className="bg-transparent hover:bg-teal-500 text-teal-700 font-semibold hover:text-white py-2 px-4 border border-teal-500 hover:border-transparent rounded"
        onClick={() => setShowModal(true)}
        type="button"
      >
        show kubeconfig for {user.name}
      </button>
    </span>
  )
}
