import {
  createActor as createUserIndexActor,
  canisterId as userIndexCanisterId,
} from '@hnn/declarations/user_index'
import { createActor as createIndividualUserActor } from '@hnn/declarations/individual_user_template'
import {
  createActor as createPostCacheActor,
  canisterId as postCacheCanisterId,
} from '@hnn/declarations/post_cache'

import {
  createActor as createConfigurationActor,
  canisterId as configurationCanisterId,
} from '@hnn/declarations/configuration'

import type { _SERVICE as _USER_INDEX_SERVICE } from '@hnn/declarations/user_index/user_index.did'
import type { _SERVICE as _INDIVIDUAL_USER_SERVICE } from '@hnn/declarations/individual_user_template/individual_user_template.did'
import type { _SERVICE as _POST_CACHE_SERVICE } from '@hnn/declarations/post_cache/post_cache.did'
import type { _SERVICE as _CONFIGURATION_SERVICE } from '@hnn/declarations/configuration/configuration.did'
import { authHelper, authState } from '$lib/stores/auth'
import type { ActorSubclass } from '@dfinity/agent'
import { get } from 'svelte/store'
import { Principal } from '@dfinity/principal'

export const host =
  import.meta.env.NODE_ENV === 'dev'
    ? 'http://localhost:4943'
    : 'https://ic0.app'

export const WEBCLIENT_CANISTER_ID = process.env.WEBCLIENT_CANISTER_ID

export type UserIndexActor = ActorSubclass<_USER_INDEX_SERVICE>
export type IndividualUserActor = ActorSubclass<_INDIVIDUAL_USER_SERVICE>
export type PostCacheActor = ActorSubclass<_POST_CACHE_SERVICE>
export type ConfigurationActor = ActorSubclass<_CONFIGURATION_SERVICE>

export function userIndex(fetch?: any): UserIndexActor {
  const authHelperData = get(authHelper)
  return createUserIndexActor(userIndexCanisterId as string, {
    agentOptions: { identity: authHelperData?.identity, host, fetch },
  }) as UserIndexActor
}

export function individualUser(
  principal?: Principal | string,
  fetch?: any,
): IndividualUserActor {
  const authHelperData = get(authHelper)
  const authStateData = get(authState)
  const canisterId = principal
    ? principal instanceof Principal
      ? principal
      : Principal.from(principal)
    : (authStateData.userCanisterId as string)
  if (!canisterId) throw "Can't find canisterId"
  return createIndividualUserActor(canisterId, {
    agentOptions: { identity: authHelperData?.identity, host, fetch },
  }) as IndividualUserActor
}

export function postCache(fetch?: any): PostCacheActor {
  const authHelperData = get(authHelper)
  return createPostCacheActor(postCacheCanisterId as string, {
    agentOptions: { identity: authHelperData?.identity, host, fetch },
  }) as PostCacheActor
}

export function configuration(fetch?: any): ConfigurationActor {
  return createConfigurationActor(configurationCanisterId, {
    agentOptions: { host, fetch },
  }) as ConfigurationActor
}
