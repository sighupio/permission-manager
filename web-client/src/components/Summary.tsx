import React from 'react'
import {useRbac} from '../hooks/useRbac'
import TemplateInfo from './TemplateInfo'
import {AggregatedRoleBinding} from "../services/role";
import {RuleSet} from "./types";

interface SummaryParameters {
  readonly pairItems: AggregatedRoleBinding[];
}

export default function Summary({ pairItems }: SummaryParameters) {
  const { clusterRoles } = useRbac()

  if (!clusterRoles) {
    return null
  }

  const ruleSets: RuleSet[] = pairItems
    .reduce((acc, p) => {
      const crs = clusterRoles.filter(c => c.metadata.name === p.template)

      const rules = crs.reduce((acc, v) => {
        acc = acc.concat(v.rules)
        return acc
      }, [])

      const ruleset = {
        template: p.template,
        rules,
        namespaces: p.namespaces === 'ALL_NAMESPACES' ? ['all'] : p.namespaces
      }

      const itemForSameTemplate = acc.find(rs => rs.template === p.template)
      if (itemForSameTemplate) {
        if (
          itemForSameTemplate.namespaces.includes('all') ||
          ruleset.namespaces.includes('all')
        ) {
          itemForSameTemplate.namespaces = ['all']
        } else {
          const templates = new Set([
            ...itemForSameTemplate.namespaces,
            ...ruleset.namespaces
          ])
          itemForSameTemplate.namespaces = Array.from(templates)
        }
      } else {
        acc = acc.concat(ruleset)
      }

      return acc
    }, [])
    .filter(x => x.namespaces.length > 0)

  return (
    <div data-testid="summary">
      <h3 className="text-xl mb-2">Summary</h3>
      <div className="border rounded py-4 px-4 bg-gray-100 inline-block">
        <TemplateInfo ruleSets={ruleSets} />
      </div>
    </div>
  )
}
