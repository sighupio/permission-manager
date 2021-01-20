import React from 'react'
import TemplatePairSelect from './TemplatePairSelect'
import {AggregatedRoleBinding} from "../services/role";
import {AggregatedRoleBindingManager} from "./new-user-wizard";

interface TemplatesParameters extends AggregatedRoleBindingManager {
  readonly pairItems: AggregatedRoleBinding[]
}

export default function Templates({pairItems, savePair, setPairItems, addEmptyPair}: TemplatesParameters) {
  const lastPair = pairItems[pairItems.length - 1]
  const addButtonDisabled =
    lastPair && lastPair.template && lastPair.namespaces.length === 0
  
  return (
    <div>
      <div className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
        templates
      </div>
      <div className="bg-gray-100  border rounded py-3 px-4 mb-3">
        {pairItems.map((p, index) => {
          return (
            <div key={p.id}>
              <div className="mb-2">
                <span className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                  #{index + 1}
                </span>
                <button
                  tabIndex={-1}
                  type="button"
                  className="bg-transparent hover:bg-red-600 text-gray-700 hover:text-gray-100 py-1 px-2 rounded hover:shadow ml-2 text-xs"
                  onClick={() =>
                    setPairItems(pairItems.filter(x => x.id !== p.id))
                  }
                >
                  delete
                </button>
              </div>
              
              <div className="flex items-center">
                <div className="flex-auto">
                  <TemplatePairSelect
                    index={index + 1}
                    onSave={savePair}
                    initialValues={p}
                  />
                </div>
              </div>
              
              <hr className="my-4"/>
            </div>
          )
        })}
        
        <button
          className={`bg-white hover:bg-teal-500 hover:text-white text-gray-800 py-2 px-6 rounded shadow ${
            addButtonDisabled ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          type="button"
          disabled={addButtonDisabled}
          onClick={addEmptyPair}
        >
          add
        </button>
      </div>
    </div>
  )
}
