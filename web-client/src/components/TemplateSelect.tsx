import React, {useEffect, useState} from 'react'
import {Rule, useRbac} from '../hooks/useRbac'
import {templateNamespacedResourceRolePrefix} from '../constants'
import Select, {components} from 'react-select'
import TemplateInfo from './TemplateInfo'

interface TemplateSelectParameters {
  /**
   * set template
   * @param template
   */
  onSelect(template: string): void,
  
  readonly initialValue: string
}

export default function TemplateSelect({onSelect, initialValue}: TemplateSelectParameters) {
  const {clusterRoles} = useRbac()
  const templateNames = (clusterRoles || [])
    .map(s => s.metadata.name)
    .filter(s => s.startsWith(templateNamespacedResourceRolePrefix))
  const [selected, setSelected] = useState(initialValue || '')
  
  useEffect(() => {
    if (templateNames.length > 0 && selected === '') {
      setSelected(templateNames[0])
    }
  }, [selected, templateNames])
  
  useEffect(() => {
    onSelect(selected)
  }, [onSelect, selected])
  
  const Option = props => {
    return (
      <div className="flex">
        <components.Option {...props} />
        <ShowTemplateInfo
          label={props.data.label}
          rules={
            clusterRoles.find(c => c.metadata.name === props.data.value).rules
          }
        />
      </div>
    )
  }
  
  return (
    <Select
      value={{
        label: selected.replace(templateNamespacedResourceRolePrefix, ''),
        value: selected,
      }}
      components={{Option}}
      onChange={e => setSelected(e.value)}
      options={templateNames.map(t => {
        return {
          label: t.replace(templateNamespacedResourceRolePrefix, ''),
          value: t,
        }
      })}
    />
  )
}

interface ShowTemplateInfoParameters {
  label: string
  rules: Rule[]
}

function ShowTemplateInfo({label, rules}: ShowTemplateInfoParameters) {
  const [coordinates, setCoordinates] = useState(null)
  return (
    <div>
      <div
        className="p-2 cursor-default"
        onMouseEnter={e => {
          setCoordinates({top: e.clientY - 250, left: e.clientX + 30})
        }}
        onMouseLeave={() => setCoordinates(null)}
      >
        info
      </div>
      {coordinates !== null ? (
        <div
          className="fixed z-10 border rounded shadow-2xl py-4 px-4 bg-gray-100"
          style={{top: coordinates.top, left: coordinates.left}}
        >
          <h2 className="text-md text-gray-700 font-bold mb-2 uppercase">
            {label}
          </h2>
          <TemplateInfo
            hideNamespaceCol
            ruleSets={[{rules, namespaces: []}]}
          />
        </div>
      ) : null}
    </div>
  )
}
