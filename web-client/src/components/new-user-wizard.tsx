import React, {useCallback, useEffect, useState} from 'react'
import uuid from 'uuid'
import {useHistory} from 'react-router-dom'
import ClusterAccessRadio from './ClusterAccessRadio'
import Templates from './Templates'
import {FullScreenLoader} from './Loader'
import Summary from './Summary'
import {useUsers} from '../hooks/useUsers'
import {AggregatedRoleBinding} from "../services/role";
import {ClusterAccess} from "./types";
import {httpRequests} from "../services/httpRequests";


export interface AggregatedRoleBindingManager {
  savePair(aggregatedRoleBinding: AggregatedRoleBinding): void
  
  setPairItems(aggregatedRoleBindings: AggregatedRoleBinding[]): void
  
  addEmptyPair(): void
}

export default function NewUserWizard() {
  const history = useHistory()
  
  const [username, setUsername] = useState<string>('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [aggregatedRoleBindings, setAggregatedRoleBindings] = useState<AggregatedRoleBinding[]>([])
  const [clusterAccess, setClusterAccess] = useState<ClusterAccess>('none')
  const [formTouched, setFormTouched] = useState<boolean>(false)
  const [showLoader, setShowLoader] = useState<boolean>(false)
  const {users} = useUsers()
  
  const validateUsername = useCallback(() => {
    if (username.length < 3) {
      setUsernameError('Required to be at least 3 characters long')
      return false
    }
    
    if (
      !username.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
      setUsernameError(`username must be DNS-1123 compliant, it must consist of lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character (e.g. 'jane.doe')`)
      return false
    }
    
    if (users.map(u => u.name).includes(username)) {
      setUsernameError(`user ${username} already exists`)
      return false
    }
    
    setUsernameError(null)
    return true
    
  }, [username, users])
  
  useEffect(
    function validateUsernameOnChange() {
      validateUsername()
    },
    [username.length, validateUsername]
  )
  
  const saveButtonDisabled =
    aggregatedRoleBindings.length === 0 ||
    usernameError !== null ||
    aggregatedRoleBindings.some(p => p.namespaces.length === 0)
  
  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formTouched) {
      setFormTouched(true)
    }
    
    const valid = validateUsername()
    
    if (!valid) {
      return
    }
    
    //todo try catch with silent console.log is not ideal nor production ready
    try {
      await httpRequests.userRequests.create(username)
      
      await httpRequests.rolebindingRequests.create.fromAggregatedRolebindings(
        aggregatedRoleBindings,
        username,
        clusterAccess
      )
      
      history.push(`/users/${username}`)
      
    } catch (e) {
      console.error(e)
    }
  }
  
  const savePair: (p: AggregatedRoleBinding) => void = useCallback(p => {
    setAggregatedRoleBindings(state => {
      if (state.find(x => x.id === p.id)) {
        return state.map(x => x.id === p.id ? p : x)
      }
      return [...state, p]
    })
  }, [])
  
  const addEmptyPair = useCallback(() => {
    setAggregatedRoleBindings(state => [...state, {id: uuid.v4(), namespaces: [], template: ''}])
  }, [])
  
  useEffect(addEmptyPair, [])
  
  return (
    <div>
      {showLoader && <FullScreenLoader/>}
      <h2 className="text-3xl mb-4 text-gray-800">New User</h2>
      <form
        onSubmit={e => {
          e.preventDefault()
          setShowLoader(true)
          handleSubmit(e)
        }}
      >
        <div>
          <div className="mb-6">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
              <span className="text-red-400 pr-1">*</span>
              Username
              <input
                autoFocus
                placeholder="jane.doe"
                className={`appearance-none block w-full  text-gray-700 border  rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white ${
                  usernameError && formTouched ? 'border-red-500' : ''
                }`}
                required
                type="text"
                value={username}
                onChange={e => {
                  if (!formTouched) {
                    setFormTouched(true)
                  }
                  setUsername(e.target.value)
                }}
              />
            </label>
            
            {usernameError && formTouched ? (
              <p className="text-red-500 text-xs italic">{usernameError}</p>
            ) : null}
          </div>
          
          <div className="mb-6">
            <Templates
              pairItems={aggregatedRoleBindings}
              savePair={savePair}
              setPairItems={setAggregatedRoleBindings}
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
        </div>
      </form>
      
      {aggregatedRoleBindings.length > 0 && aggregatedRoleBindings.some(p => p.namespaces.length > 0) ? (
        <>
          <div className="mt-12 mb-4"/>
          <Summary pairItems={aggregatedRoleBindings}></Summary>
        </>
      ) : null}
    </div>
  )
}
