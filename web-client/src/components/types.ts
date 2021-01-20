import {Rule} from "../hooks/useRbac";
import {AggregatedRoleBinding} from "../services/role";

export interface RuleSet {
  
  readonly template?: string
  readonly rules: Rule[],
  /**
   * ALL_NAMESPACES (from TemplatePair) is converted to ['all']
   * @see AggregatedRoleBinding
   */
  readonly namespaces: string[]
}

/**
 * NONE = no cluster wide access
 * READ = can read all resources
 * WRITE = can read/write all resources
 */
export type ClusterAccess = "none" | "read" | "write" | null
