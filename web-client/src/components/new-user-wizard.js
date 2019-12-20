import React, { useState, useEffect, useCallback } from 'react'

import uuid from 'uuid'
import axios from 'axios'
import { useHistory } from 'react-router-dom'
import { templateClusterResourceRolePrefix } from '../constants'
import ClusterAccessRadio from './ClusterAccessRadio'
import Templates from './Templates'
import { FullScreenLoader } from './Loader'
import Summary from './Summary'
import { useUsers } from '../hooks/useUsers'

export default function NewUserWizard() {
  const history = useHistory()

  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState(null)
  const [pairItems, setPairItems] = useState([])
  const [clusterAccess, setClusterAccess] = useState('none')
  const [formTouched, setFormTouched] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const { users } = useUsers()

  const validateUsername = useCallback(() => {
    if (username.length < 3) {
      setUsernameError('Required to be at least 3 characters long')
      return false
    } else if (
      !username.match(
        /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*)$/
      )
    ) {
      setUsernameError(
        `user can only contain lowercase letters, dots and dashes`
      )
      return false
    } else if (users.map(u => u.name).includes(username)) {
      setUsernameError(`user ${username} already exists`)
      return false
    } else {
      setUsernameError(null)
      return true
    }
  }, [username, users])

  useEffect(
    function validateUsernameOnChange() {
      validateUsername()
    },
    [username.length, validateUsername]
  )

  const saveButtonDisabled =
    pairItems.length === 0 ||
    usernameError !== null ||
    pairItems.some(p => p.namespaces.length === 0)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formTouched) {
      setFormTouched(true)
    }

    const valid = validateUsername()
    if (!valid) {
      return
    }

    try {
      await axios.post('/api/create-user', { name: username })

      for await (const p of pairItems) {
        if (p.namespaces === 'ALL_NAMESPACES') {
          const clusterRolebindingName =
            username + '___' + p.template + '___all_namespaces'
          await axios.post('/api/create-cluster-rolebinding', {
            generated_for_user: username,
            roleName: p.template,
            subjects: [
              {
                kind: 'User',
                name: username,
                apiGroup: 'rbac.authorization.k8s.io'
              }
            ],
            clusterRolebindingName
          })
        } else {
          for await (const n of p.namespaces) {
            const rolebindingName = username + '___' + p.template + '___' + n
            await axios.post('/api/create-rolebinding', {
              generated_for_user: username,
              roleName: p.template,
              namespace: n,
              roleKind: 'ClusterRole',
              subjects: [
                {
                  kind: 'User',
                  name: username,
                  apiGroup: 'rbac.authorization.k8s.io'
                }
              ],
              rolebindingName
            })
          }
        }
      }

      if (clusterAccess !== 'none') {
        let template = ''
        if (clusterAccess === 'read') {
          template = templateClusterResourceRolePrefix + 'read-only'
        }
        if (clusterAccess === 'write') {
          template = templateClusterResourceRolePrefix + 'admin'
        }
        const clusterRolebindingName = username + '___' + template
        await axios.post('/api/create-cluster-rolebinding', {
          generated_for_user: username,
          roleName: template,
          subjects: [
            {
              kind: 'User',
              name: username,
              apiGroup: 'rbac.authorization.k8s.io'
            }
          ],
          clusterRolebindingName
        })
      }

      history.push(`/users/${username}`)
    } catch (e) {
      console.error(e)
    }
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
      return [...state, { id: uuid.v4(), namespaces: [], template: '' }]
    })
  }, [])

  useEffect(addEmptyPair, [])

  return (
    <div>
      {showLoader && <FullScreenLoader />}
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
            </label>
            <input
              autoFocus
              placeholder="Kelsey Hightower"
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

            {usernameError && formTouched ? (
              <p className="text-red-500 text-xs italic">{usernameError}</p>
            ) : null}
          </div>

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

          <hr className="my-6" />
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

      {pairItems.length > 0 && pairItems.some(p => p.namespaces.length > 0) ? (
        <>
          <div className="mt-12 mb-4" />
          <Summary pairItems={pairItems}></Summary>
        </>
      ) : null}
    </div>
  )
}
