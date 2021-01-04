import {Rule} from "../hooks/useRbac";

/**
 * a type used by Summary. It normalizes ALL_NAMESPACES string to ['all']
 * @function Summary
 */
export interface RuleSet {
  
  template?: string
  rules: Rule[],
  /**
   * it is always a namespace. ALL_NAMESPACES is converted to ['all']
   */
  namespaces: string[]
}
