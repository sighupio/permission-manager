import React, {useCallback, useEffect, useState} from 'react'
import {httpClient} from '../../services/httpClient'
import JSONPretty from 'react-json-pretty'
import {RESOURCE_TYPES_NAMESPACED, RESOURCE_TYPES_NON_NAMESPACED, VERBS} from '../../constants'
import {useRbac} from '../../hooks/useRbac'
import uuid from 'uuid'

export default () => {
  const { clusterRoles, refreshRbacData } = useRbac()
  const [hideSystemCusterRoles, setHideSystemCusterRoles] = useState<boolean>(true)

  if (!clusterRoles) return <div>no data</div>

  const crs = hideSystemCusterRoles
    ? clusterRoles.filter(c => {
        return !c.metadata.name.startsWith('system:')
      })
    : clusterRoles

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div>
          <h1 style={{ padding: 20, margin: 30, background: 'burlywood' }}>
            cluster roles
          </h1>
          <NewRoleForm refreshRbacData={refreshRbacData} />
          <div>
            <label>
              hide system clusterRoleBindings (role name starting with
              "system:")
              <input
                type="checkbox"
                checked={hideSystemCusterRoles}
                onChange={e => setHideSystemCusterRoles(e.target.checked)}
              />
            </label>
          </div>
          {crs.map(r => {
            return (
              <Role
                role={r}
                key={r.metadata.uid}
                refreshRbacData={refreshRbacData}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NewRoleForm({ refreshRbacData }) {
  const [roleName, setRoleName] = useState('')
  const [rules, setRules] = useState([])

  async function onSubmit(e) {
    e.preventDefault()
    await httpClient.post('/api/create-cluster-role', {
      roleName,
      rules: rules.map(r => {
        const o = {
          ...r,
          apiGroups: [
            '*'
            // '',
            // 'admissionregistration.k8s.io',
            // 'apiextensions.k8s.io',
            // 'apiregistration.k8s.io',
            // 'apps',
            // 'authentication.k8s.io',
            // 'authorization.k8s.io',
            // 'autoscaling',
            // 'batch',
            // 'certificates.k8s.io',
            // 'coordination.k8s.io',
            // 'events.k8s.io',
            // 'extensions',
            // 'networking.k8s.io',
            // 'node.k8s.io',
            // 'policy',
            // 'rbac.authorization.k8s.io',
            // 'scheduling.k8s.io',
            // 'storage.k8s.io',
          ]
        }
        delete o.id
        return o
      })
    })
    refreshRbacData()
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ padding: 20, margin: 30, background: 'burlywood' }}
    >
      <h1>new cluster role</h1>
      <div>
        <label>
          cluster role name
          <input
            type="text"
            required
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
          />
        </label>
      </div>

      <h3>rules</h3>
      <RulesList rules={rules} setRules={setRules} />
      <button type="submit">submit</button>
    </form>
  )
}

function Role({ role: r, refreshRbacData }) {
  const [showRules, setShowRules] = useState(false)

  async function deleteRole(e) {
    await httpClient.post('/api/delete-cluster-role', {
      roleName: r.metadata.name
    })
    refreshRbacData()
  }

  return (
    <div
      onMouseEnter={() => setShowRules(true)}
      onMouseLeave={() => setShowRules(false)}
      key={r.metadata.uid}
      style={{ padding: 20, margin: 30, background: 'burlywood' }}
    >
      <button onClick={deleteRole}>delete</button>
      <div>name: {r.metadata.name}</div>
      {showRules ? (
        <div>
          rules:
          <JSONPretty data={r.rules} />
        </div>
      ) : null}
    </div>
  )
}

function RulesList({ rules, setRules }) {
  const addRule = s => setRules(state => [...state, s])
  const removeRule = id => setRules(state => state.filter(sub => sub.id !== id))
  const updateRule = useCallback(
    s => {
      setRules(state => {
        return state.map(sub => {
          if (s.id === sub.id) {
            return s
          }

          return sub
        })
      })
    },
    [setRules]
  )

  return (
    <div style={{ padding: 10, margin: '20px 0', background: 'orange' }}>
      {rules.map(r => {
        return (
          <div key={r.id}>
            <RuleItem id={r.id} updateRule={updateRule} />
            <button onClick={() => removeRule(r.id)} type="button">
              delete
            </button>
            <hr />
          </div>
        )
      })}

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          onClick={() => addRule({ resources: [], verbs: [], id: uuid.v4() })}
        >
          new
        </button>
      </div>
    </div>
  )
}

function RuleItem({ id, updateRule }) {
  const [verbs, setVerbs] = useState([])
  const [allverbs, setAllVerbs] = useState(false)
  const [resources, setResources] = useState([])

  useEffect(() => {
    updateRule({ id, verbs, resources })
  }, [verbs, resources, updateRule, id])

  return (
    <div>
      <div>
        resources:
        <div style={{ paddingLeft: 20 }}>
          namespaced
          <ul>
            <label>
              all
              <input
                type="checkbox"
                onChange={e => {
                  if (e.target.checked) {
                    const r = [
                      ...resources.filter(
                        x => !RESOURCE_TYPES_NAMESPACED.includes(x)
                      ),
                      ...RESOURCE_TYPES_NAMESPACED
                    ]
                    setResources(r)
                  } else {
                    const r = resources.filter(
                      x => !RESOURCE_TYPES_NAMESPACED.includes(x)
                    )
                    setResources(r)
                  }
                }}
              />
            </label>

            {RESOURCE_TYPES_NAMESPACED.map(resource => {
              return (
                <li key={resource}>
                  <label>
                    <input
                      checked={resources.includes(resource)}
                      type="checkbox"
                      onChange={e => {
                        if (e.target.checked) {
                          setResources([...resources, resource])
                        } else {
                          setResources(resources.filter(v => v !== resource))
                        }
                      }}
                    />
                    {resource}
                  </label>
                </li>
              )
            })}
          </ul>
          non namespaced
          <ul>
            <label>
              all
              <input
                type="checkbox"
                onChange={e => {
                  if (e.target.checked) {
                    const r = [
                      ...resources.filter(
                        x => !RESOURCE_TYPES_NON_NAMESPACED.includes(x)
                      ),
                      ...RESOURCE_TYPES_NON_NAMESPACED
                    ]
                    setResources(r)
                  } else {
                    const r = resources.filter(
                      x => !RESOURCE_TYPES_NON_NAMESPACED.includes(x)
                    )
                    setResources(r)
                  }
                }}
              />
            </label>
            {RESOURCE_TYPES_NON_NAMESPACED.map(resource => {
              return (
                <li key={resource}>
                  <label>
                    <input
                      checked={resources.includes(resource)}
                      type="checkbox"
                      onChange={e => {
                        if (e.target.checked) {
                          setResources([...resources, resource])
                        } else {
                          setResources(resources.filter(v => v !== resource))
                        }
                      }}
                    />
                    {resource}
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div>
        verbs:
        <div style={{ paddingLeft: 20 }}>
          <label style={{ marginRight: 20 }}>
            <input
              type="checkbox"
              checked={allverbs}
              onChange={e => {
                if (e.target.checked) {
                  setAllVerbs(true)
                  setVerbs(VERBS)
                } else {
                  setVerbs([])
                  setAllVerbs(false)
                }
              }}
            />
            all
          </label>
          {VERBS.map(verb => {
            return (
              <label style={{ marginRight: 20 }} key={verb}>
                <input
                  checked={verbs.includes(verb)}
                  type="checkbox"
                  onChange={e => {
                    if (e.target.checked) {
                      setVerbs([...verbs, verb])
                    } else {
                      setAllVerbs(false)
                      setVerbs(verbs.filter(v => v !== verb))
                    }
                  }}
                />
                {verb}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
