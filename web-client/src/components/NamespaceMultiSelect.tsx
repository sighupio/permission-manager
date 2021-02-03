import React from 'react'
import {useNamespaceList} from '../hooks/useNamespaceList'
import Select from 'react-select'

interface NamespaceMultiSelectArguments {
  /**
   * set namespaces
   * @param namespace
   */
  onSelect(namespace: string[]),
  
  /**
   * namespaces
   */
  readonly value: string[],
  readonly disabled: boolean,
  readonly placeholder: string
}

export default function NamespaceMultiSelect({onSelect, value, disabled, placeholder}: NamespaceMultiSelectArguments) {
  const {namespaceList} = useNamespaceList()
  
  const options = disabled ? [] : namespaceList
    .map(ns => {
      return {value: ns.metadata.name, label: ns.metadata.name}
    })
  
  return (
    <Select
      value={value.map(ns => ({value: ns, label: ns}))}
      closeMenuOnSelect={false}
      isMulti
      placeholder={placeholder}
      isDisabled={disabled}
      options={options}
      hideSelectedOptions={false}
      onChange={vs => {
        if (!vs) {
          onSelect([])
          return
        }
        onSelect(vs.map(x => x.value))
      }}
    />
  )
}
