import {Rule} from "../hooks/useRbac";

export interface RuleSet {
  /**
   * //todo understand why sometime is present, other times no.
   */
  template?: string
  rules: Rule[],
  /**
   * it is always a namespace. ALL_NAMESPACES is converted to ['all']
   */
  namespaces: string[]
}
