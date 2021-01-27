import {useRbac} from '../hooks/useRbac'
import {useUsers} from '../hooks/useUsers'
import React, {useCallback, useEffect, useState} from 'react'
import uuid from 'uuid'
import ClusterAccessRadio from './ClusterAccessRadio'
import {templateClusterResourceRolePrefix} from '../constants'
import Templates from './Templates'
import {FullScreenLoader} from './Loader'
import Summary from './Summary'
import {useHistory} from 'react-router-dom'
import {extractUsersRoles} from "../services/role";
import {httpClient} from '../services/httpClient'
import {User} from "../types";
import {ClusterAccess} from "./types";
import {httpRolebindingRequests} from "../services/rolebindingRequests";

interface EditUserParameters {
  readonly user: User;
}

export default function EditUser({user}: EditUserParameters) {
  const [showLoader, setShowLoader] = useState<boolean>(false)
  const username = user.name
  const {clusterRoleBindings, roleBindings, refreshRbacData} = useRbac()
  const history = useHistory()
  const {refreshUsers} = useUsers()
  
  useEffect(() => {
    refreshRbacData()
  }, [refreshRbacData])
  
  const {rbs, crbs, extractedPairItems} = extractUsersRoles(roleBindings, clusterRoleBindings, username);
  const [clusterAccess, setClusterAccess] = useState<ClusterAccess>('none')
  const [initialClusterAccess, setInitialClusterAccess] = useState<ClusterAccess>(null)
  const [pairItems, setPairItems] = useState(extractedPairItems)
  
  useEffect(() => {
    if (pairItems.length === 0) {
      setPairItems(extractedPairItems)
      
      const ca = crbs.find(crb =>
        crb.metadata.name.includes(templateClusterResourceRolePrefix)
      )
      if (ca) {
        if (ca.roleRef.name.endsWith('admin')) {
          if (initialClusterAccess === null) {
            setInitialClusterAccess('write')
          }
          setClusterAccess('write')
        }
        
        if (ca.roleRef.name.endsWith('read-only')) {
          if (initialClusterAccess === null) {
            setInitialClusterAccess('read')
          }
          setClusterAccess('read')
        }
      }
    }
  }, [crbs, initialClusterAccess, pairItems.length, extractedPairItems])
  
  async function handleUserDeletion() {
    setShowLoader(true)
    await deleteUserResources()
    await httpClient.post('/api/delete-user', {
      username
    })
  }
  
  async function deleteUserResources() {
    for await (const p of rbs) {
      await httpClient.post('/api/delete-rolebinding', {
        rolebindingName: p.metadata.name,
        namespace: p.metadata.namespace
      })
    }
    
    for await (const p of crbs) {
      await httpClient.post('/api/delete-cluster-rolebinding', {
        rolebindingName: p.metadata.name
      })
    }
  }
  
  async function handleSubmit(e) {
    await deleteUserResources()
    const consumed = []
    
    for await (const aggregatedRolebinding of pairItems) {
      if (aggregatedRolebinding.namespaces === 'ALL_NAMESPACES') {
        const clusterRolebindingName = username + '___' + aggregatedRolebinding.template + 'all_namespaces'
        
        if (!consumed.includes(clusterRolebindingName)) {
          
          await httpRolebindingRequests.createRolebindingAllNamespaces({
            clusterRolebindingName: clusterRolebindingName,
            addGeneratedForUser: false,
            template: aggregatedRolebinding.template,
            username: username
          })
          
          consumed.push(clusterRolebindingName)
        }
        
      } else {
        for await (const namespace of aggregatedRolebinding.namespaces) {
          const rolebindingName = username + '___' + aggregatedRolebinding.template + '___' + namespace
          
          if (!consumed.includes(rolebindingName)) {
            await httpRolebindingRequests.createRolebinding({
              template: aggregatedRolebinding.template,
              username: username,
              namespace: namespace,
              roleBindingName: rolebindingName,
              addGeneratedForUser: true
            });
            
            consumed.push(rolebindingName)
          }
        }
      }
    }
    
    await httpRolebindingRequests.createClusterRolebinding({
      clusterAccess,
      username,
      addGeneratedForUser: false
    });
    
    window.location.reload()
  }
  
  const savePair = useCallback(p => {
    setPairItems(state => {
      if (state.find(x => x.id === p.id)) {
        return state.map(x => {
          if (x.id === p.id) {
            return p
          }
          return x
        })
      } else {
        return [...state, p]
      }
    })
  }, [])
  
  const addEmptyPair = useCallback(() => {
    setPairItems(state => {
      return [...state, {id: uuid.v4(), namespaces: [], template: ''}]
    })
  }, [])
  
  const saveButtonDisabled =
    pairItems.length === 0 || pairItems.some(p => p.namespaces.length === 0)
  
  if (crbs && crbs.length === 0 && rbs && rbs.length === 0) {
    return <div>...loading</div>
  }
  
  return (
    <div>
      {showLoader && <FullScreenLoader/>}
      
      <div className="flex content-between items-center mb-4">
        <h2 className="text-3xl text-gray-800">
          User: <span data-testid="username-heading">{username}</span>
        </h2>
        <div>
          <button
            tabIndex={-1}
            type="button"
            className="bg-transparent hover:bg-red-600 text-gray-700 hover:text-gray-100 py-1 px-2 rounded hover:shadow ml-2 text-xs"
            onClick={() => {
              const confirmed = window.confirm(
                `Confirm deletion of User ${username}`
              )
              
              if (confirmed) {
                handleUserDeletion().then(async () => {
                  await refreshUsers()
                  history.push('/')
                })
              }
            }}
          >
            delete
          </button>
        </div>
      </div>
      
      <form
        onSubmit={e => {
          e.preventDefault()
          setShowLoader(true)
          handleSubmit(e)
        }}
      >
        <div className="mb-6">
          <Templates
            pairItems={pairItems}
            savePair={savePair}
            setPairItems={setPairItems}
            addEmptyPair={addEmptyPair}
          />
        </div>
        
        <ClusterAccessRadio
          clusterAccess={clusterAccess}
          setClusterAccess={setClusterAccess}
        />
        
        <hr className="my-6"/>
        
        <button
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow ${
            saveButtonDisabled ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={saveButtonDisabled}
          type="submit"
        >
          save
        </button>
      </form>
      
      {pairItems.length > 0 && pairItems.some(p => p.namespaces.length > 0) ? (
        <>
          <div className="mt-12 mb-4"/>
          <Summary pairItems={pairItems}></Summary>
        </>
      ) : null}
    </div>
  )
}
