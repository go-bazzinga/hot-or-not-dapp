import Log from '$lib/utils/Log'
import { AuthClient } from '@dfinity/auth-client'
import { get } from 'svelte/store'
import {
  authState,
  authHelper,
  referralId,
  loadingAuthStatus,
} from '$lib/stores/auth'
import { updateProfile } from './profile'
import { Principal } from '@dfinity/principal'
import { userIndex } from './backend'
import { checkSignupStatusCanister } from './signup'

async function logout() {
  const authHelperState = get(authHelper)
  await authHelperState.client?.logout()
  const identity = authHelperState.client?.getIdentity()
  const principal = await identity?.getPrincipal()
  authState.set({
    isLoggedIn: false,
    idString: principal?.toText(),
    showLogin: false,
  })
}

async function updateUserIndexCanister(): Promise<{
  error: boolean
  new_user: boolean
  referral?: string
  error_details?: 'SIGNUP_NOT_ALLOWED' | 'OTHER'
}> {
  try {
    let new_user = false
    let userCanisterPrincipal: Principal

    const authStateData = get(authState)
    const referralStore = get(referralId)

    const res = await userIndex().get_user_canister_id_from_user_principal_id(
      Principal.from(authStateData.idString),
    )

    if (res[0]) {
      //existing user
      userCanisterPrincipal = res[0]
      new_user = false
    } else {
      // new user
      const isSignupAllowed = await checkSignupStatusCanister()
      if (!isSignupAllowed) {
        return {
          error: true,
          error_details: 'SIGNUP_NOT_ALLOWED',

          new_user: true,
        }
      } else {
        new_user = true
        const referral: [] | [Principal] = referralStore.principalId
          ? [Principal.from(referralStore.principalId)]
          : []
        userCanisterPrincipal =
          await userIndex().get_requester_principals_canister_id_create_if_not_exists_and_optionally_allow_referrer(
            referral,
          )
      }
    }

    Log('info', 'Update user index canister info', {
      userCanisterPrincipal: userCanisterPrincipal?.toText(),
      from: 'auth.updateUserIndexCanister',
    })

    const authHelperData = get(authHelper)
    authHelper.set({
      ...authHelperData,
      userCanisterPrincipal,
    })
    authState.set({
      ...authStateData,
      userCanisterId: userCanisterPrincipal?.toText(),
    })
    if (
      authStateData.isLoggedIn &&
      authStateData.idString &&
      userCanisterPrincipal
    ) {
      try {
        const { idb } = await import('$lib/idb')
        idb.set(
          'canisters',
          authStateData.idString,
          userCanisterPrincipal.toText(),
        )
      } catch (e) {
        Log('warn', 'Error while accessing IDB', {
          error: e,
          source: 'auth.updateUserIndexCanister',
          type: 'idb',
        })
        return { error: false, new_user, referral: referralStore.principalId }
      }
    }

    return { error: false, new_user, referral: referralStore.principalId }
  } catch (e) {
    const authFailed = (e as any)?.message?.includes?.('Failed to authenticate')
    if (authFailed) {
      await logout()
    } else {
      Log('warn', 'Failed to authenticate', {
        error: e,
        from: 'auth.updateUserIndexCanister',
      })
    }
    return { error: true, error_details: 'OTHER', new_user: false }
  }
}

export async function initializeAuthClient(): Promise<{
  error: boolean
  new_user: boolean
  referral?: string
} | void> {
  loadingAuthStatus.set(true)
  const authStateData = get(authState)
  const authHelperData = get(authHelper)
  let client: AuthClient | undefined = undefined
  if (!authHelperData.client) {
    client = await AuthClient.create({
      idleOptions: {
        disableIdle: true,
        disableDefaultIdleCallback: true,
      },
    })
  } else {
    client = authHelperData.client
  }
  const identity = client?.getIdentity()
  const principal = await identity?.getPrincipal()
  if (await client?.isAuthenticated()) {
    authState.set({
      userCanisterId: authStateData.userCanisterId,
      isLoggedIn: true,
      idString: principal?.toText(),
      showLogin: authStateData.showLogin,
    })

    authHelper.set({
      client,
      userCanisterPrincipal: authHelperData.userCanisterPrincipal,
      identity,
      idPrincipal: principal,
    })

    const res = await updateUserIndexCanister()
    if (res.error && res.error_details === 'SIGNUP_NOT_ALLOWED') {
      loadingAuthStatus.set(false)
      return { error: true, new_user: true }
    }
    await updateProfile()
    loadingAuthStatus.set(false)

    return { error: false, new_user: res.new_user, referral: res.referral }
  } else {
    authState.set({
      isLoggedIn: false,
      idString: principal?.toText(),
      showLogin: authStateData.showLogin,
    })

    authHelper.set({
      client,
      identity,
      idPrincipal: principal,
    })

    await updateProfile()
    loadingAuthStatus.set(false)
  }
}
