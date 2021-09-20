import React from 'react'
import {ClusterAccess} from "./types";

interface ClusterAccessRadioParameters {
  readonly clusterAccess: ClusterAccess,
  setClusterAccess(clusterAccess: ClusterAccess): void
}

export default function ClusterAccessRadio({clusterAccess, setClusterAccess}: ClusterAccessRadioParameters) {
  return (
    <div>
      <div data-testid="nonnamespaced-select">
        <div className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
          access to cluster resouces (non-namespaced):
        </div>
        <div>
          <label className="block uppercase tracking-wide text-gray-700 text-xs mb-2">
            <input
              type="radio"
              name="nonnamespace"
              onChange={() => setClusterAccess('none')}
              checked={clusterAccess === 'none'}
            />
            <span className="ml-2">none</span>
          </label>
          
          <label className="block uppercase tracking-wide text-gray-700 text-xs mb-2">
            <input
              type="radio"
              name="nonnamespace"
              onChange={() => setClusterAccess('read')}
              checked={clusterAccess === 'read'}
            />
            <span className="ml-2">read-only</span>
          </label>
          
          <label className="block uppercase tracking-wide text-gray-700 text-xs mb-2">
            <input
              type="radio"
              name="nonnamespace"
              onChange={() => setClusterAccess('write')}
              checked={clusterAccess === 'write'}
            />
            <span className="ml-2">read-write</span>
          </label>
        </div>
      </div>
    </div>
  )
}
