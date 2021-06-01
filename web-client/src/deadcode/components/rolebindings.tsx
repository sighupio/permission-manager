import React, {useCallback, useEffect, useState} from 'react'
import {httpClient} from '../../services/httpClient'
import uuid from 'uuid'
import {RoleBinding as RoleBindingType, Subject, useRbac} from '../../hooks/useRbac'
import {useNamespaceList} from '../../hooks/useNamespaceList'
import {useUsers} from '../../hooks/useUsers'
import {RoleSelect} from '../../components/role-select'
import {ClusterRoleSelect} from './cluster-role-select'
import {httpRequests} from "../../services/httpRequests";

export default () => {
  const {refreshRbacData, roleBindings} = useRbac()
  
  if (!roleBindings) return <div>no data</div>
  
  return (
    <div>
      <div style={{display: 'flex'}}>
        <div>
          <h1 style={{padding: 20, margin: 30, background: 'yellow'}}>
            rolebindings
          </h1>
          <NewRoleBindingForm fetchData={refreshRbacData}/>
          {roleBindings.map(rb => {
            return (
              <RoleBinding
                rolebinding={rb}
                key={rb.metadata.uid}
                fetchData={refreshRbacData}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RoleBinding({rolebinding: rb, fetchData}: { rolebinding: RoleBindingType, fetchData(): void }) {
  const [, setShowMore] = useState(false)
  
  async function deleteRoleBinding(e) {
    await httpClient.post('/api/delete-rolebinding', {
      rolebindingName: rb.metadata.name,
      namespace: rb.metadata.namespace
    })
    fetchData()
  }
  
  return (
    <div
      onMouseEnter={() => setShowMore(true)}
      onMouseLeave={() => setShowMore(false)}
      style={{padding: 20, margin: 30, background: 'yellow'}}
    >
      <button onClick={deleteRoleBinding}>delete</button>
      
      <div>name: {rb.metadata.name}</div>
      <div>namespace: {rb.metadata.namespace}</div>
      <div>
        <div>role: {rb.roleRef.name}</div>
        <div>
          subjects:
          {(rb.subjects || []).map(s => {
            return (
              <div key={s.name + s.kind}>
                <div style={{paddingLeft: 10}}>
                  name: {s.name} ({s.kind})
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* {showMore ? (
      ) : null} */}
    </div>
  )
}

function NewRoleBindingForm({fetchData}: { fetchData(): void }) {
  const [namespace, setNamespace] = useState<string>('default')
  const [roleName, setRoleName] = useState<string>('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [roleKind, setRoleKind] = useState<string>('Role')
  const [rolebindingName, setRolebindingName] = useState<string>('')
  const {namespaceList} = useNamespaceList()
  
  function resetForm() {
    setRoleName('')
    setRolebindingName('')
    setNamespace('default')
    setSubjects([])
  }
  
  async function onSubmit(e) {
    e.preventDefault()
    
    await httpRequests.rolebindingRequests.create.rolebinding({
      namespace,
      template: roleName,
      roleBindingName: rolebindingName,
      roleKind,
      subjects: subjects.map(s => ({
        ...s,
        namespace: 'permission-manager'
      })),
    })
    
    fetchData()
    resetForm()
  }
  
  return (
    <form
      onSubmit={onSubmit}
      style={{padding: 20, margin: 30, background: 'yellow'}}
    >
      <h1>new rolebinding</h1>
      <div>
        <label>
          rolebinding name
          <input
            type="text"
            required
            value={rolebindingName}
            onChange={e => setRolebindingName(e.target.value)}
          />
        </label>
      </div>
      
      <div>
        <label>
          namespace
          <select
            value={namespace}
            onChange={e => setNamespace(e.target.value)}
          >
            {namespaceList.map(ns => {
              return (
                <option key={ns.metadata.name} value={ns.metadata.name}>
                  {ns.metadata.name}
                </option>
              )
            })}
          </select>
        </label>
      </div>
      
      <div>
        Role kind:
        <div>
          <label>
            <input
              type="radio"
              checked={roleKind === 'Role'}
              onChange={e => {
                if (e.target.checked) {
                  setRoleKind('Role')
                }
              }}
            />
            Role
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              checked={roleKind === 'ClusterRole'}
              onChange={e => {
                if (e.target.checked) {
                  setRoleKind('ClusterRole')
                }
              }}
            />
            ClusterRole
          </label>
        </div>
      </div>
      
      {roleKind === 'Role' ? (
        <RoleSelect onSelected={r => setRoleName(r.metadata.name)}/>
      ) : (
        <ClusterRoleSelect onSelected={r => setRoleName(r.metadata.name)}/>
      )}
      
      <div>
        <h2>subjects</h2>
        <SubjectList
          subjects={subjects}
          setSubjects={setSubjects}
        ></SubjectList>
      </div>
      
      <button type="submit">submit</button>
    </form>
  )
}

function SubjectList({subjects, setSubjects}) {
  const addSubject = s => setSubjects(state => [...state, s])
  const removeSubject = id =>
    setSubjects(state => state.filter(sub => sub.id !== id))
  const updateSubject = useCallback(s => {
    setSubjects(state => {
      return state.map(sub => {
        if (s.id === sub.id) {
          return s
        }
        
        return sub
      })
    })
  }, [setSubjects])
  
  const {users} = useUsers()
  
  return (
    <div style={{padding: 10, margin: '20px 0', background: 'orange'}}>
      {subjects.map(s => {
        return (
          <div key={s.id}>
            <SubjectItem id={s.id} updateSubject={updateSubject}/>
            <button onClick={() => removeSubject(s.id)} type="button">
              delete
            </button>
            <hr/>
          </div>
        )
      })}
      
      <div style={{marginTop: 20}}>
        <button
          type="button"
          onClick={() =>
            addSubject({kind: 'User', name: users[0].name, id: uuid.v4()})
          }
        >
          new
        </button>
      </div>
    </div>
  )
}

function SubjectItem({id, updateSubject}) {
  const [kind, setKind] = useState('User')
  const [subjectName, setSubjectName] = useState('')
  const {users} = useUsers()
  
  useEffect(() => {
    setSubjectName(users[0].name)
  }, [kind, users])
  
  useEffect(() => {
    updateSubject({id, kind, name: subjectName})
  }, [id, kind, subjectName, updateSubject])
  
  return (
    <div>
      <div>
        Kind:
        <label>
          <input
            type="radio"
            checked={kind === 'User'}
            onChange={e => {
              if (e.target.checked) {
                setKind('User')
              }
            }}
          />
          user
        </label>
      </div>
      <div>
        <label>
          {kind === 'User' ? 'user' : 'group'}
          <select
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
          >
            {users.map(u => {
              return (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              )
            })}
          </select>
        </label>
      </div>
    </div>
  )
}
