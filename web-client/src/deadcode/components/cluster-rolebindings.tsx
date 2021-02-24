import React, {useCallback, useEffect, useState} from 'react'
import uuid from 'uuid'
import {ClusterRoleBinding, RoleBinding as RoleBindingType, Subject, useRbac} from '../../hooks/useRbac'
import {useUsers} from '../../hooks/useUsers'
import {ClusterRoleSelect} from './cluster-role-select'
import {httpRequests} from "../../services/httpRequests";

export default () => {
  const {refreshRbacData, clusterRoleBindings} = useRbac()
  const [
    hideSystemCusterRoleBindings,
    setHideSystemCusterRoleBindings
  ] = useState(true)
  
  if (!clusterRoleBindings) return <div>no data</div>
  
  const crbs = hideSystemCusterRoleBindings
    ? clusterRoleBindings.filter(c => {
      return !c.roleRef.name.startsWith('system:')
    })
    : clusterRoleBindings
  
  return (
    <div>
      <div style={{display: 'flex'}}>
        <div>
          <h1 style={{padding: 20, margin: 30, background: 'aqua'}}>
            cluster rolebindings
          </h1>
          <NewClusterRoleBindingForm fetchData={refreshRbacData}/>
          <div>
            <label>
              hide system clusterRoleBindings (role name starting with
              "system:")
              <input
                type="checkbox"
                checked={hideSystemCusterRoleBindings}
                onChange={e =>
                  setHideSystemCusterRoleBindings(e.target.checked)
                }
              />
            </label>
          </div>
          {crbs.map(rb => {
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

function RoleBinding({rolebinding: rb, fetchData}: { rolebinding: RoleBindingType | ClusterRoleBinding, fetchData }) {
  const [, setShowMore] = useState(false)
  
  async function deleteRoleBinding(e) {
    
    // we check if its a rolebinding
    if ("namespace" in rb.metadata) await httpRequests.rolebindingRequests.delete.rolebinding([(rb as RoleBindingType)])
    //cluster role binding case
    else await httpRequests.rolebindingRequests.delete.clusterRolebinding([rb])
    
    
    fetchData()
    return;
  }
  
  return (
    <div
      onMouseEnter={() => setShowMore(true)}
      onMouseLeave={() => setShowMore(false)}
      style={{padding: 20, margin: 30, background: 'aqua'}}
    >
      <button onClick={deleteRoleBinding}>delete</button>
      
      <div>name: {rb.metadata.name}</div>
      <div>namespace: {rb.metadata['namespace'] ?? "global"}</div>
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

function NewClusterRoleBindingForm({fetchData}) {
  const [roleName, setRoleName] = useState<string>('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [clusterRolebindingName, setClusterRolebindingName] = useState('')
  
  async function onSubmit(e) {
    e.preventDefault()
    
    await httpRequests.rolebindingRequests.create.clusterRolebinding({
      subjects: subjects.map(s => ({
        ...s,
        namespace: 'permission-manager'
      })),
      template: roleName,
      clusterRolebindingName,
    })
    
    fetchData()
  }
  
  return (
    <form
      onSubmit={onSubmit}
      style={{padding: 20, margin: 30, background: 'aqua'}}
    >
      <h1>new cluster rolebinding</h1>
      <div>
        <label>
          cluster rolebinding name
          <input
            type="text"
            required
            value={clusterRolebindingName}
            onChange={e => setClusterRolebindingName(e.target.value)}
          />
        </label>
      </div>
      
      <ClusterRoleSelect onSelected={cr => setRoleName(cr.metadata.name)}/>
      
      <div>
        <h2>subjects</h2>
        <SubjectList
          subjects={subjects}
          setSubjects={setSubjects}
        />
      </div>
      
      <button type="submit">submit</button>
    </form>
  )
}

function SubjectList({subjects, setSubjects}: { subjects: Subject[], setSubjects(state: any): void }) {
  
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
          <div key={s.name}>
            <SubjectItem id={s.name} updateSubject={updateSubject}/>
            <button onClick={() => removeSubject(s.name)} type="button">
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
  const [kind, setKind] = useState<string>('User')
  const [subjectName, setSubjectName] = useState<string>('')
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
