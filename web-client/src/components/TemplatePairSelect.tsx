import React, {useEffect, useState} from 'react'
import NamespaceMultiSelect from './NamespaceMultiSelect'
import TemplateSelect from './TemplateSelect'
import {AggregatedRoleBinding, AggregatedRoleBindingNamespace} from "../services/role";

interface TemplatePairSelectParameters {
  readonly index?: number;
  
  onSave(aggregatedRoleBinding: AggregatedRoleBinding): void;
  
  readonly initialValues: AggregatedRoleBinding;
}

//todo why index is used in Templates.tsx?
export default function TemplatePairSelect({onSave, initialValues}: TemplatePairSelectParameters) {
  const [namespaces, setNamespaces] = useState<AggregatedRoleBindingNamespace>(initialValues.namespaces || [])
  const [allNamespace, setAllNamespaces] = useState<boolean>(initialValues.namespaces === 'ALL_NAMESPACES' ? true : null)
  const [template, setTemplate] = useState(initialValues.template)
  
  useEffect(() => {
    if (allNamespace === null) {
      return
    }
    
    if (allNamespace) {
      setNamespaces('ALL_NAMESPACES')
    } else {
      setNamespaces([])
    }
  }, [allNamespace])
  
  useEffect(() => {
    onSave({
      id: initialValues.id,
      namespaces,
      template: template
    })
  }, [initialValues.id, namespaces, onSave, template])
  
  return (
    <div style={{display: 'flex'}}>
      <div style={{flex: 3}} data-testid="template-select">
        <div className="block uppercase tracking-wide text-gray-700 text-xs  mb-2">
          template
        </div>
        <TemplateSelect
          onSelect={t => setTemplate(t)}
          initialValue={initialValues.template}
        />
      </div>
      <div style={{marginLeft: 20, flex: 3}} data-testid="namespaces-select">
        <div className="block uppercase tracking-wide text-gray-700 text-xs  mb-2">
          <span className="text-red-400 pr-1">*</span>
          namespaces
        </div>
        
        <NamespaceMultiSelect
          value={Array.isArray(namespaces) ? namespaces : []}
          placeholder={allNamespace ? 'all' : 'my-namespace'}
          disabled={allNamespace}
          onSelect={ns => {
            setNamespaces(ns)
          }}
        />
        <div className="mt-2">
          <label className="block uppercase tracking-wide text-gray-700 text-xs mb-2">
            <input
              type="checkbox"
              checked={!!allNamespace}
              onChange={e => setAllNamespaces(e.target.checked)}
            />
            <span className="ml-2">all Namespaces</span>
          </label>
        </div>
      </div>
    </div>
  )
}
