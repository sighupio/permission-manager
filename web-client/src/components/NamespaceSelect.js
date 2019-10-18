import { useNamespaceList } from '../hooks/useNamespaceList'
import React, { useState, useEffect } from 'react'
export default function NamespaceSelect({ onSelect }) {
  const { namespaceList } = useNamespaceList()
  const [selected, setSelected] = useState()

  useEffect(() => {
    if (namespaceList.length > 0 && !selected) {
      setSelected(namespaceList[0])
    }
  }, [namespaceList, selected])

  useEffect(() => {
    onSelect(selected)
  }, [onSelect, selected])

  return (
    <select value={selected} onChange={e => setSelected(e.target.value)}>
      {namespaceList.map(ns => {
        return (
          <option key={ns.metadata.name} value={ns.metadata.name}>
            {ns.metadata.name}
          </option>
        )
      })}
    </select>
  )
}
