import type {
  FollowEntryDetail,
  BetOutcomeForBetMaker,
  GetPostsOfUserProfileError,
  MintEvent,
  PlacedBetDetail,
  PostDetailsForFrontend,
  SystemTime,
  TokenEvent,
  UserProfileDetailsForFrontendV2,
} from '@hnn/declarations/individual_user_template/individual_user_template.did'
import { setUserProperties } from '@hnn/components/analytics/GA.utils'
import getDefaultImageUrl from '$lib/utils/getDefaultImageUrl'
import Log from '$lib/utils/Log'
import { generateRandomName } from '$lib/utils/randomUsername'
import { authState } from '$lib/stores/auth'
import {
  userProfile,
  emptyProfileValues,
  type UserProfile,
} from '$lib/stores/app'
import { Principal } from '@dfinity/principal'
import { get } from 'svelte/store'
import { individualUser } from './backend'
import { getCanisterId } from './canisterId'
import type { PostPopulated } from './feed'
import { isPrincipal } from '$lib/utils/isPrincipal'
import { setUser } from '@sentry/sveltekit'

export interface UserProfileFollows extends UserProfile {
  i_follow: boolean
  index_id: bigint
}

export interface PostPopulatedWithBetDetails extends PostPopulated {
  placed_bet_details: PlacedBetDetail
}

async function fetchProfile() {
  try {
    return await individualUser().get_profile_details_v2()
  } catch (e) {
    Log('warn', 'Could not fetch user profile', {
      error: e,
      from: 'profile.fetchProfile',
    })
  }
}

export function sanitizeProfile(
  profile: UserProfileDetailsForFrontendV2,
  userId: string,
): UserProfile {
  return {
    username_set: !!profile.unique_user_name[0],
    unique_user_name:
      profile.unique_user_name[0] || generateRandomName('username', userId),
    profile_picture_url:
      profile.profile_picture_url[0] || getDefaultImageUrl(userId),
    display_name: profile.display_name[0] || generateRandomName('name', userId),
    principal_id: profile.principal_id.toText(),
    followers_count: Number(profile.followers_count),
    following_count: Number(profile.following_count),
    profile_stats: {
      hots_earned_count: Number(profile.profile_stats.hot_bets_received) || 0,
      nots_earned_count: Number(profile.profile_stats.not_bets_received) || 0,
      lifetime_earnings: Number(profile.lifetime_earnings) || 0,
    },
    is_migrated: Boolean(Object.values(profile.migration_info || {})?.[0]),
    updated_at: Date.now(),
  }
}

export async function updateProfile(profile?: UserProfileDetailsForFrontendV2) {
  const authStateData = get(authState)
  if (authStateData.isLoggedIn) {
    const updateProfile = profile || (await fetchProfile())
    if (updateProfile) {
      // updateProfile.migration_info = {
      //   MigratedFromHotOrNot: {
      //     account_principal: Principal.from('2vxsx-fae'),
      //   },
      // }

      userProfile.set({
        ...sanitizeProfile(updateProfile, authStateData.idString || 'random'),
      })
      authState.update((o) => ({
        ...o,
        isMigrated: Boolean(
          Object.values(updateProfile.migration_info || {})?.[0],
        ),
      }))
      if (updateProfile.unique_user_name[0]) {
        try {
          const { idb } = await import('$lib/idb')
          idb.set(
            'canisters',
            updateProfile.unique_user_name[0],
            authStateData.userCanisterId,
          )
        } catch (e) {
          Log('warn', 'Error while accessing IDB', {
            error: e,
            from: 'profile.updateProfile',
            type: 'idb',
          })
        }
      }
    } else {
      Log('warn', 'No profile found', {
        from: 'profile.updateProfile',
      })
    }
  } else {
    userProfile.set(emptyProfileValues)
  }
  updateUserProperties() // GA
  setUser(
    authStateData?.idString
      ? {
          id: authStateData.idString,
        }
      : null,
  ) //Sentry
  Log('info', 'Updated user profile', {
    profile: get(userProfile),
    from: 'profile.updateProfile',
  })
}

async function updateUserProperties() {
  const profile = get(userProfile)
  const authStateData = get(authState)
  if (authStateData.isLoggedIn && profile.principal_id) {
    const res = await fetchTokenBalance()
    setUserProperties({
      display_name: profile.display_name,
      userId: profile.principal_id,
      user_canister_id: authStateData.userCanisterId,
      ...(profile.username_set && { username: profile.unique_user_name }),
      ...(!res.error && { wallet_balance: res.balance }),
    })
  } else {
    setUserProperties()
  }
}

type ProfilePostsResponse =
  | {
      error: true
    }
  | {
      error: false
      posts: PostDetailsForFrontend[]
      noMorePosts: boolean
    }

type ProfileSpeculationsResponse =
  | {
      error: true
    }
  | {
      error: false
      posts: PostPopulatedWithBetDetails[]
      noMorePosts: boolean
    }

export function serializeProfilePostsResponse(posts: PostDetailsForFrontend[]) {
  return posts.map((post) => {
    return {
      ...post,
      created_by_user_principal_id: post.created_by_user_principal_id.toText(),
      home_feed_ranking_score: Number(post.home_feed_ranking_score),
      hot_or_not_feed_ranking_score: Number(post.hot_or_not_feed_ranking_score),
      like_count: Number(post.like_count),
      total_view_count: Number(post.total_view_count),
      id: Number(post.id),
    }
  })
}

export async function fetchPosts(
  id: string,
  from: number,
  count: number = 10,
): Promise<ProfilePostsResponse> {
  try {
    const canId = await getCanisterId(id)
    const res = await individualUser(
      Principal.from(canId),
    ).get_posts_of_this_user_profile_with_pagination(
      BigInt(from),
      BigInt(from + count),
    )
    if ('Ok' in res) {
      return {
        error: false,
        posts: res.Ok,
        noMorePosts: res.Ok.length < 10,
      }
    } else if ('Err' in res) {
      type UnionKeyOf<U> = U extends U ? keyof U : never
      type errors = UnionKeyOf<GetPostsOfUserProfileError>
      const err = Object.keys(res.Err)[0] as errors
      switch (err) {
        case 'ExceededMaxNumberOfItemsAllowedInOneRequest':
        case 'InvalidBoundsPassed':
          return { error: true }
        case 'ReachedEndOfItemsList':
          return { error: false, noMorePosts: true, posts: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log('warn', 'Error while loading posts', {
      error: e,
      from: 'profile.fetchPosts',
    })
    return { error: true }
  }
}

export async function fetchSpeculations(
  id: string,
  from: number,
): Promise<ProfileSpeculationsResponse> {
  try {
    const canId = await getCanisterId(id)

    const res = await individualUser(
      Principal.from(canId),
    ).get_hot_or_not_bets_placed_by_this_profile_with_pagination(BigInt(from))
    const populatedRes = await populatePosts(res)
    if (populatedRes.error) {
      return { error: true }
    }
    return {
      error: false,
      posts: populatedRes.posts,
      noMorePosts: res.length < 10,
    }
  } catch (e) {
    Log('warn', 'Error while loading posts', {
      error: e,
      from: 'profile.fetchSpeculations',
    })
    return { error: true }
  }
}

async function populatePosts(posts: PlacedBetDetail[]) {
  try {
    if (!posts.length) {
      return { posts: [], error: false }
    }

    const res = await Promise.all(
      posts.map(async (post) => {
        try {
          const r = await individualUser(
            Principal.from(post.canister_id),
          ).get_individual_post_details_by_id(post.post_id)
          return {
            ...r,
            post_id: post.post_id,
            placed_bet_details: post,
            score: BigInt(0),
            created_by_user_principal_id:
              r.created_by_user_principal_id.toText(),
            publisher_canister_id: post.canister_id.toText(),
            created_by_profile_photo_url:
              r.created_by_profile_photo_url[0] ||
              getDefaultImageUrl(r.created_by_user_principal_id, 54),
          } satisfies PostPopulatedWithBetDetails
        } catch (_) {
          return undefined
        }
      }),
    )
    return {
      posts: res.filter((o) => !!o) as PostPopulatedWithBetDetails[],
      error: false,
    }
  } catch (e) {
    Log('warn', 'Error while loading posts', {
      error: e,
      from: 'profile.populatePosts',
    })
    return { error: true, posts: [] }
  }
}

export async function fetchLovers(id: string, from?: bigint) {
  try {
    const canId = await getCanisterId(id)

    const res = await individualUser(
      Principal.from(canId),
    ).get_principals_that_follow_this_profile_paginated(from ? [from] : [])
    if (!res) {
      throw new Error(`Unknown response, ${JSON.stringify(res)}`)
    }
    const populatedUsers = await populateProfiles(from ? res.slice(1) : res)
    if (populatedUsers.error) {
      throw new Error(
        `Error while populating, ${JSON.stringify(populatedUsers)}`,
      )
    }
    return {
      error: false,
      lovers: populatedUsers.users,
      noMoreLovers: res.length < 9,
    }
  } catch (e) {
    Log('warn', 'Error while loading followers', {
      error: e,
      from: 'profile.fetchLovers',
    })
    return { error: true }
  }
}

export async function fetchLovingUsers(id: string, from?: bigint) {
  try {
    const canId = await getCanisterId(id)

    const res = await individualUser(
      Principal.from(canId),
    ).get_principals_this_profile_follows_paginated(from ? [from] : [])
    if (!res) {
      throw new Error(`Unknown response, ${JSON.stringify(res)}`)
    }
    const populatedUsers = await populateProfiles(from ? res.slice(1) : res)
    if (populatedUsers.error) {
      throw new Error(
        `Error while populating, ${JSON.stringify(populatedUsers)}`,
      )
    }
    return {
      error: false,
      lovers: populatedUsers.users,
      noMoreLovers: res.length < 10,
    }
  } catch (e) {
    Log('warn', 'Error while loading followers', {
      error: e,
      from: 'profile.fetchLovingUsers',
    })
    return { error: true }
  }
}

async function populateProfiles(list: Array<[bigint, FollowEntryDetail]>) {
  try {
    if (!list.length) {
      return { users: [], error: false }
    }

    const authStateData = get(authState)

    const res = await Promise.all(
      list.map(async ([id, detail]) => {
        const principalId = detail?.principal_id?.toText()
        if (!principalId) return
        if (principalId === '2vxsx-fae') return

        const r = await individualUser(
          Principal.from(detail.canister_id),
        ).get_profile_details()

        return {
          ...sanitizeProfile(r as any, principalId),
          index_id: id,
          i_follow: authStateData.isLoggedIn
            ? await doIFollowThisUser(principalId)
            : false,
        } as UserProfileFollows
      }),
    )

    return {
      users: res.filter((o) => !!o) as UserProfileFollows[],
      error: false,
    }
  } catch (e) {
    Log('warn', 'Error while loading profile', {
      error: e,
      from: 'profile.populateProfiles',
    })
    return { error: true, users: [] }
  }
}

export async function doIFollowThisUser(principalId?: string) {
  if (!principalId) return false
  if (!isPrincipal(principalId)) {
    throw 'Invalid Principal ID'
  }
  const canisterId = await getCanisterId(principalId)
  if (!canisterId) {
    throw 'Could not find Canister ID'
  }
  try {
    const res = await individualUser().do_i_follow_this_user({
      followee_canister_id: Principal.from(canisterId),
      followee_principal_id: Principal.from(principalId),
    })
    return !!res['Ok']
  } catch (e) {
    Log('warn', 'Error while loading following status', {
      error: e,
      from: 'profile.doIFollowThisUser',
    })
    return false
  }
}

export async function loveUser(principalId: string) {
  try {
    if (!isPrincipal(principalId)) {
      throw 'Invalid Principal ID'
    }
    const canisterId = await getCanisterId(principalId)
    if (!canisterId) {
      throw 'Could not find Canister ID'
    }
    const res =
      await individualUser().update_profiles_i_follow_toggle_list_with_specified_profile(
        {
          followee_canister_id: Principal.from(canisterId),
          followee_principal_id: Principal.from(principalId),
        },
      )
    if ('Ok' in res) {
      return true
    } else {
      return false
    }
  } catch (e) {
    Log('warn', 'Error while following a status', {
      error: e,
      from: 'profile.loveUser',
    })
    return false
  }
}
type UnionKeyOf<U> = U extends U ? keyof U : never
type UnionValueOf<U> = U extends U ? U[keyof U] : never

const walletEventDetails = {} as WalletEvent
type WalletEvent = UnionKeyOf<TokenEvent>
export type WalletEventType = typeof walletEventDetails
type WalletEventSubDetails = UnionValueOf<TokenEvent>
type NotificationEventType = Omit<
  WalletEventType,
  'BetOnHotOrNotPost' | 'NewUserSignup'
>
type EventOutcome = UnionKeyOf<BetOutcomeForBetMaker>

export interface TransactionHistory {
  id: BigInt
  type: UnionKeyOf<TokenEvent>
  token: number
  timestamp: SystemTime
  subType: WalletEventType
  details?: WalletEventSubDetails
  eventOutcome?: EventOutcome
}

export interface NotificationHistory {
  id: BigInt
  type: NotificationEventType
  token: number
  timestamp: SystemTime
  details?: WalletEventSubDetails
  eventOutcome?: EventOutcome
}

type HistoryResponse =
  | {
      error: true
    }
  | {
      error: false
      history: TransactionHistory[]
      endOfList: boolean
    }

type NotificationResponse =
  | {
      error: true
    }
  | {
      error: false
      notifications: NotificationHistory[]
      endOfList: boolean
    }

function transformHistoryRecords(
  res: Array<[bigint, TokenEvent]>,
  _filter?: UnionKeyOf<MintEvent>,
): TransactionHistory[] {
  const history: TransactionHistory[] = []

  res.forEach((o) => {
    const event = o[1]

    const type = Object.keys(event)[0] as UnionKeyOf<TokenEvent>

    const subType =
      (Object.keys(event?.[type]?.details || {})?.[0] as WalletEventType) || ''
    const details = ((event[type] as WalletEvent) || {})?.[subType] as
      | WalletEventSubDetails
      | undefined

    const eventOutcome = Object.keys(details?.['event_outcome'] || {})[0] as
      | EventOutcome
      | undefined

    history.push({
      id: o[0],
      type,
      subType,
      token: Object.values(event)?.[0]?.amount || 0,
      timestamp: event[type].timestamp as SystemTime,
      details,
      eventOutcome,
    })
  })

  return history
}

export async function setBetDetailToDb(
  post: PostPopulated,
  betDetail?: PlacedBetDetail,
) {
  if (!post) return

  try {
    const idb = (await import('$lib/idb')).idb
    idb.set('bets', post.publisher_canister_id + '@' + post.post_id, betDetail)
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'profile.setBetDetailToDb',
      type: 'idb',
    })
    return
  }
}

export async function fetchHistory(
  from: number,
  filter?: UnionKeyOf<MintEvent>,
): Promise<HistoryResponse> {
  try {
    const res =
      await individualUser().get_user_utility_token_transaction_history_with_pagination(
        BigInt(from),
        BigInt(from + 10),
      )

    if ('Ok' in res) {
      const history = await transformHistoryRecords(res.Ok, filter)

      return {
        error: false,
        history,
        endOfList: history.length < 10,
      }
    } else if ('Err' in res) {
      type errors = UnionKeyOf<GetPostsOfUserProfileError>
      const err = Object.keys(res.Err)[0] as errors
      switch (err) {
        case 'InvalidBoundsPassed':
          return { error: true }
        case 'ReachedEndOfItemsList':
          return { error: false, endOfList: true, history: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log('warn', 'Error while loading transaction history', {
      error: e,
      from: 'profile.fetchHistory',
    })
    return { error: true }
  }
  return { error: true }
}

async function transformNotificationRecords(res: Array<[bigint, TokenEvent]>) {
  const notifications: NotificationHistory[] = []

  res.forEach((o) => {
    const event = o[1]
    const type = Object.keys(event)[0] as UnionKeyOf<TokenEvent>
    const subType = Object.keys(event[type].details)[0] as WalletEventType
    const details = (event[type] as WalletEvent)?.[
      subType
    ] as WalletEventSubDetails
    const eventOutcome = Object.keys(
      details?.['event_outcome'] || {},
    )[0] as EventOutcome

    notifications.push({
      id: o[0],
      type: subType,
      token: Object.values(event)?.[0]?.amount || 0,
      timestamp: event[type].timestamp as SystemTime,
      details,
      eventOutcome,
    })
  })
  return notifications
}

export async function fetchNotifications(
  from: number,
): Promise<NotificationResponse> {
  try {
    const res =
      await individualUser().get_user_utility_token_transaction_history_with_pagination(
        BigInt(from),
        BigInt(from + 20),
      )
    if ('Ok' in res) {
      const notifications = await transformNotificationRecords(res.Ok)

      return {
        error: false,
        notifications,
        endOfList: history.length < 10,
      }
    } else if ('Err' in res) {
      type errors = UnionKeyOf<GetPostsOfUserProfileError>
      const err = Object.keys(res.Err)[0] as errors
      switch (err) {
        case 'InvalidBoundsPassed':
          return { error: true }
        case 'ReachedEndOfItemsList':
          return { error: false, endOfList: true, notifications: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log('warn', 'Error while loading transaction history', {
      error: e,
      from: 'profile.fetchNotifications',
    })
    return { error: true }
  }
  return { error: true }
}

export async function fetchTokenBalance(): Promise<
  { error: false; balance: number } | { error: true }
> {
  try {
    const res = await individualUser().get_utility_token_balance()
    return { error: false, balance: Number(res) }
  } catch (e) {
    Log('warn', 'Error while loading token balance', {
      error: e,
      from: 'profile.fetchTokenBalance',
    })
    return { error: true }
  }
}
