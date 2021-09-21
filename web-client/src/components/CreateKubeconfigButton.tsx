import React, {useEffect, useState} from 'react'
import {Dialog} from '@reach/dialog'
import Editor from 'react-simple-code-editor'
import {ClusterRoleBinding, RoleBinding, useRbac} from "../hooks/useRbac";
import {extractUsersRoles} from "../services/role";
import {User} from "../types";
import {httpRequests} from "../services/httpRequests";

/**
 * getValidNamespaces extracts the valid kubeconfig namespace values
 */
function getValidNamespaces(roleBindings: RoleBinding[], clusterRoleBindings: ClusterRoleBinding[], user: User): string[] {
  const {extractedPairItems} = extractUsersRoles(roleBindings, clusterRoleBindings, user.name);
  
  const uniqueNamespaces = extractedPairItems.length === 0 ? [] : [...new Set(extractedPairItems.map(i => i.namespaces).flat(1))];
  
  // we remove the invalid namespaces from the array
  const validNamespaces = uniqueNamespaces.filter(i => i !== "ALL_NAMESPACES");
  
  //a) If no elements are present we add the default namespace to the extracted namespaces.
  if (validNamespaces.length === 0) {
    validNamespaces.push("default");
  }
  return validNamespaces;
}

interface CreateKubeconfigButtonParameters {
  user: User;
}

export default function CreateKubeconfigButton({user}: CreateKubeconfigButtonParameters) {

  const [showModal, setShowModal] = useState<boolean>(false)
  const [kubeconfig, setKubeconfig] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false);
  const {clusterRoleBindings, roleBindings} = useRbac()
  const validNamespaces = getValidNamespaces(roleBindings, clusterRoleBindings, user);
  
  //b) we generate an array of unique namespaces.
  const [chosenNamespace, setChosenNamespace] = useState<string>(validNamespaces[0]);
  
  useEffect(() => {
    // !kubeconfig.includes(chosenNamespace) is needed to remake the API request if the chosenNamespace changed
    if (showModal && (kubeconfig === '' || !kubeconfig.includes("namespace: " + chosenNamespace))) {
      httpRequests.kubeconfigCreate(user.name, chosenNamespace)
        .then(({data}) => {
          setKubeconfig(data.kubeconfig)
        })
    }
    
    // needed for properly refresh the state if the user has selected a namespace that doesn't exist anymore
    if (!validNamespaces.find(n => n === chosenNamespace)) {
      setChosenNamespace(validNamespaces[0])
    }
    
  }, [kubeconfig, showModal, user.name, chosenNamespace, validNamespaces])
  
  return (
    <span className="flex">
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
                    function () {
                      setCopied(true)
                      console.log('Async: Copying to clipboard was successful!')
                    },
                    function (err) {
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
        className="bg-transparent hover:bg-teal-500 text-teal-700 font-semibold hover:text-white py-2 px-4 border border-teal-500 hover:border-transparent rounded whitespace-no-wrap"
        onClick={() => setShowModal(true)}
        type="button"
      >
        show kubeconfig for {user.name}
      </button>
      <select
        defaultValue={chosenNamespace}
        onChange={e => setChosenNamespace(e.target.value)}
        style={{
          marginLeft: "5%"
        }}
      >
            {validNamespaces.map((ns) => {
              return (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              )
            })}
      </select>
    </span>
  )
}
