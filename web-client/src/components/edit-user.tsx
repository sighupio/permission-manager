import { ClusterRoleBinding, useRbac } from '../hooks/useRbac'
import { useUsers } from '../hooks/useUsers'
import React, { useCallback, useEffect, useState } from 'react'
import ClusterAccessRadio from './ClusterAccessRadio'
import { templateClusterResourceRolePrefix } from '../constants'
import Templates from './Templates'
import { FullScreenLoader } from './Loader'
import Summary from './Summary'
import { useHistory } from 'react-router-dom'
import { AggregatedRoleBinding, extractUsersRoles } from "../services/role";
import { User } from "../types";
import { ClusterAccess } from "./types";
import { httpRequests } from "../services/httpRequests";
import { Dialog } from "@reach/dialog";
import CreateKubeconfigButton from "./CreateKubeconfigButton";

interface EditUserParameters {
  readonly user: User;
}

/**
 * extract the initial clusterBindingRoleValue.
 * @param clusterRoleBinding ClusterRoleBinding
 * @todo this bootstrap cases are based off an enum. To implement dynamic cluster roles it needs to be refactored
 * @return ClusterAccess|null - null if no state change needed.
 */
function getClusterBindindingAccessValue(clusterRoleBinding: ClusterRoleBinding): ClusterAccess | null {
  if (clusterRoleBinding.roleRef.name.endsWith('admin')) {
    return 'write'
  }

  if (clusterRoleBinding.roleRef.name.endsWith('read-only')) {
    return 'read'
  }

  return null;
}

export default function EditUser({ user }: EditUserParameters) {
  const [showLoader, setShowLoader] = useState<boolean>(false)
  const username = user.name
  const { clusterRoleBindings, roleBindings, refreshRbacData } = useRbac()
  const history = useHistory()
  const { refreshUsers } = useUsers()

  const [clusterAccess, setClusterAccess] = useState<ClusterAccess>('none')
  const [initialClusterAccess, setInitialClusterAccess] = useState<ClusterAccess>(null)
  const [aggregatedRoleBindings, setAggregatedRoleBindings] = useState<AggregatedRoleBinding[]>([])
  const [canCheckLegacyUser, setCanCheckLegacyUser] = useState(false);
  const [showLegacyMigrationModal, setShowLegacyMigrationModal] = useState(false);
  const [roleBindingNotFound, setRoleBindingNotFound] = useState(false);

  useEffect(() => {
    refreshRbacData()
  }, [refreshRbacData])

  useEffect(() => {
    let { rbs, crbs, extractedPairItems } = extractUsersRoles(roleBindings, clusterRoleBindings, username);

    if (extractedPairItems.length === 0) {
      setRoleBindingNotFound(true);
    } else {
      setRoleBindingNotFound(false);
    }

    // we proceed to bootstrap aggregatedRoleBindings
    setAggregatedRoleBindings(extractedPairItems)
  }, [roleBindings, clusterRoleBindings])

  useEffect(() => {
    setCanCheckLegacyUser(true);

    let { rbs, crbs, extractedPairItems } = extractUsersRoles(roleBindings, clusterRoleBindings, username);

    // we bootstrap clusterRoleBinding value.
    const clusterRoleBinding = crbs.find(crb => crb.metadata.name.includes(templateClusterResourceRolePrefix))

    if (!clusterRoleBinding) {
      return;
    }

    const clusterBindingAccessValue = getClusterBindindingAccessValue(clusterRoleBinding)

    // if null we don't set any state.
    if (!clusterBindingAccessValue) {
      return;
    }

    // we bootstrap initialClusterAccess if its value is null
    if (initialClusterAccess === null) {
      setInitialClusterAccess(clusterBindingAccessValue)
    }

    setClusterAccess(clusterBindingAccessValue)
  }, [roleBindings, clusterRoleBindings, initialClusterAccess])

  useEffect(() => {
    async function checkLegacyUser(): Promise<boolean> {
      setShowLoader(true)

      const namespaces = aggregatedRoleBindings.reduce((acc, aggregatedRoleBinding) => {
        if (aggregatedRoleBinding.namespaces === "ALL_NAMESPACES") {
          return acc
        }

        return [...new Set([...acc, ...aggregatedRoleBinding.namespaces])]
      }, [] as string[])

      const legacyUserReq = await httpRequests.checkLegacyUser(username, namespaces)

      return legacyUserReq.data.legacyUserDetected;
    }

    if (aggregatedRoleBindings.length !== 0 && canCheckLegacyUser) {
      checkLegacyUser().then((legacyUserDetected) => {
        setShowLoader(false)
        setCanCheckLegacyUser(false)

        if (legacyUserDetected) {
          setShowLegacyMigrationModal(true)
        }
      })
    }
  }, [aggregatedRoleBindings, username, canCheckLegacyUser])

  async function handleUserDeletion() {
    setShowLoader(true)

    await deleteUserResources()

    await httpRequests.userRequests.delete(username)
  }

  /**
   * delete all the user-resources currently in the k8s cluster
   */
  async function deleteUserResources() {
    let { rbs, crbs, extractedPairItems } = extractUsersRoles(roleBindings, clusterRoleBindings, username);

    await httpRequests.rolebindingRequests.delete.rolebinding(rbs);
    await httpRequests.rolebindingRequests.delete.clusterRolebinding(crbs);
  }

  async function handleSubmit(e, reloadAfterSubmit = true) {
    //we delete all the user resources.
    await deleteUserResources()

    //we create the resources choosen in the UI
    await httpRequests.rolebindingRequests.create.fromAggregatedRolebindings(
      aggregatedRoleBindings,
      username,
      clusterAccess
    );

    setAggregatedRoleBindings(aggregatedRoleBindings)

    if (reloadAfterSubmit) {
      window.location.reload()
    }
  }

  const savePair: (p: AggregatedRoleBinding) => void = useCallback(p => {
    setAggregatedRoleBindings(state => {

      if (state.find(x => x.id === p.id)) {
        return state.map(x => x.id === p.id ? p : x)
      }

      return [...state, p]

    })
  }, [])

  const addEmptyPair = useCallback(() => {
    setAggregatedRoleBindings(state => [...state, { id: '', namespaces: [], template: '' }])
  }, [])

  const saveButtonDisabled = aggregatedRoleBindings.length === 0 || aggregatedRoleBindings.some(p => p.namespaces.length === 0)

  // if (crbs && crbs.length === 0 && rbs && rbs.length === 0) {
  //   return <div>...loading</div>
  // }

  return (
    <div>
      {showLoader && <FullScreenLoader />}
      {showLegacyMigrationModal && <LegacyUserModal user={user} upgradeUser={handleSubmit}
        close={() => setShowLegacyMigrationModal(false)}
        username={username}></LegacyUserModal>
      }
      <div className="flex items-center m-10 bg-blue-100 rounded-lg p-5 justify-items-center">
        <div className="flex flex-col m-0 flex-auto">
          <p className='text-gray-700 font-bold uppercase text-xs'>Username</p>
          <h2 className="text-3xl text-gray-800 font-black">
            <span data-testid="username-heading">{username}</span>
          </h2>
        </div>
        <div>
          <button
            tabIndex={-1}
            type="button"
            className="bg-red-300 hover:bg-red-600 hover:text-gray-100 py-1 px-2 rounded hover:shadow text-gray-700 font-bold uppercase text-xs "
            onClick={() => {
              const confirmed = window.confirm(
                `Confirm deletion of User ${username}`
              )

              if (confirmed) {
                handleUserDeletion().then(async () => {
                  await refreshUsers()
                  history.push('/')
                })
              }
            }}
          >
            delete
          </button>
        </div>
      </div>

      {roleBindingNotFound && (
        <div className="flex items-center m-10 bg-red-200 rounded-lg p-5 justify-items-center">
          <div className="flex flex-col content-around">
            <p className='text-gray-700 font-bold uppercase text-xs'>Error</p>
            <p className="p-2">Permission Manager can't retrieve the user's permissions. This is usually caused by a manual action on the cluster. <strong>Try to recreate the permissions</strong></p>
          </div>
          <span className="bg-red-300 py-1 px-2 rounded hover:shadow text-gray-700 font-bold uppercase text-md">
            ⚠️
          </span>
        </div>
      )}
      <form
        onSubmit={e => {
          e.preventDefault()
          setShowLoader(true)
          handleSubmit(e)
        }}
      >
        <div className="mb-6">
          <Templates
            pairItems={aggregatedRoleBindings}
            savePair={savePair}
            setPairItems={setAggregatedRoleBindings}
            addEmptyPair={addEmptyPair}
          />
        </div>

        <ClusterAccessRadio
          clusterAccess={clusterAccess}
          setClusterAccess={setClusterAccess}
        />

        <hr className="my-6" />

        <button
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow ${saveButtonDisabled ? ' opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={saveButtonDisabled}
          type="submit"
        >
          save
        </button>
      </form>

      {aggregatedRoleBindings.length > 0 && aggregatedRoleBindings.some(p => p.namespaces.length > 0) ? (
        <>
          <div className="mt-12 mb-4" />
          <Summary pairItems={aggregatedRoleBindings} />
        </>
      ) : null}
    </div>
  )
}

interface LegacyUserModalProps {
  close();
  upgradeUser(event, reload);
  username: string;
  user: User;
}

function LegacyUserModal({ close, user, username, upgradeUser }: LegacyUserModalProps) {
  const [upgradingUser, setUpgradingUser] = useState(true);

  useEffect(() => {
    async function handleUpgradeUser() {
      await upgradeUser(null, false)
    }

    setUpgradingUser(true);
    handleUpgradeUser().then(() => {
      setUpgradingUser(false);
    })
  }, [upgradeUser])

  return (
    <Dialog
      className="max-w-4xl mx-auto bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4"
      isOpen={true}
    >
      <div>
        <div>
          <div className="flex justify-between">
            <h2 className="text-3xl mb-4 text-gray-800">
              Legacy user detected
            </h2>
          </div>
          <div>
            <p>Users from versions older than 1.6.0 have to be upgraded in order to work with the new kubeconfig.</p>
            <p>Upgrading user <strong>{username}</strong>...</p>
            {
              !upgradingUser &&
              <p>Done!</p>
            }
          </div>
          <div className="flex mt-4">
            <div>
              <button
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow ${upgradingUser ? ' opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={upgradingUser}
                onClick={() => {
                  close();
                }}>
                Ok
              </button>
            </div>
            <div className="ml-4">
              <CreateKubeconfigButton user={user} />
            </div>
          </div>

        </div>
        <div className="flex w-full mt-4 flex-col" style={{ backgroundColor: "#fff9e8", padding: 8, borderRadius: 4, border: "1px solid #8a6a0a" }}>
          <h3 className="mb-1" style={{ color: "#8a6a0a" }}><strong>Notice</strong></h3>
          <p style={{ color: "#343741" }}>The old kubeconfig file won't work anymore</p>
        </div>
      </div>
    </Dialog>
  )
}


