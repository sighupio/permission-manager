import React from 'react'
import {templateNamespacedResourceRolePrefix} from '../constants'
import {RuleSet} from "./types";

interface TemplateInfoParameters {
 readonly ruleSets: RuleSet[];
 readonly hideNamespaceCol?: boolean;
}

export default function TemplateInfo({ruleSets, hideNamespaceCol}: TemplateInfoParameters) {
  return (
    <fieldset disabled={true}>
      <table className="text-left">
        <colgroup>
          <col width="160"/>
          <col width="60"/>
          <col width="60"/>
          {hideNamespaceCol ? null : <col/>}
        </colgroup>
        
        <thead className="text-gray-700 text-xs uppercase">
        <tr>
          <th className="px-3">resource</th>
          <th className="px-3">read</th>
          <th className="px-3">write</th>
          {hideNamespaceCol ? null : <th className="px-3">namespaces</th>}
        </tr>
        </thead>
        
        <tbody className="text-gray-700 text-xs">
        <tr className="bg-gray-200 h-2"/>
        {ruleSets.map(({rules, namespaces}, index) => {
          return rules.map((rule, index) => {
            return (
              <React.Fragment key={index}>
                {rule.resources.map((res, i) => {
                  const r =
                    rule.verbs.includes('*') || rule.verbs.includes('read')
                  const rw =
                    rule.verbs.includes('*') || rule.verbs.includes('create')
                  return (
                    <tr
                      key={i}
                      className={`h-1 ${
                        i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'
                      }`}
                    >
                      <td className="py-0 px-3">
                        <div className="flex items-center">
                          {res.replace(
                            templateNamespacedResourceRolePrefix,
                            '',
                          )}
                        </div>
                      </td>
                      <td className="py-0 px-3">
                        <div className="flex items-center justify-center">
                          <label className="my-1 mx-0 block uppercase tracking-wide text-gray-700 text-xs mb-2">
                            <input
                              type="checkbox"
                              checked={r}
                              onChange={() => {
                              }}
                            />
                          </label>
                        </div>
                      </td>
                      
                      <td className="py-0 px-3">
                        <div className="flex items-center justify-center">
                          <label className="my-1 mx-0 block uppercase tracking-wide text-gray-700 text-xs mb-2">
                            <input
                              type="checkbox"
                              checked={rw}
                              onChange={() => {
                              }}
                            />
                          </label>
                        </div>
                      </td>
                      
                      {hideNamespaceCol ? null : (
                        <td className="py-0 px-3">
                          <div className="flex items-center justify-center">
                            {namespaces.length > 0
                              ? namespaces.join(', ')
                              : namespaces[0]}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </React.Fragment>
            )
          })
        })}
        </tbody>
      </table>
    </fieldset>
  )
}
