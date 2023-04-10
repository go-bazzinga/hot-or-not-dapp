import type {
  GetPostsOfUserProfileError,
  MintEvent,
  PlacedBetDetail,
  PostDetailsForFrontend,
  SystemTime,
  TokenEvent,
  UserProfileDetailsForFrontend,
} from '$canisters/individual_user_template/individual_user_template.did'
import { setUserProperties } from '$components/seo/GA.svelte'
import {
  identifyUserGS,
  unidentifyUserGS,
} from '$components/seo/GoSquared.svelte'
import getDefaultImageUrl from '$lib/utils/getDefaultImageUrl'
import Log from '$lib/utils/Log'
import { generateRandomName } from '$lib/utils/randomUsername'
import { authState } from '$stores/auth'
import userProfile, {
  emptyProfileValues,
  type UserProfile,
} from '$stores/userProfile'
import { Principal } from '@dfinity/principal'
import { get } from 'svelte/store'
import { individualUser } from './backend'
import { getCanisterId } from './canisterId'
import type { PostPopulated } from './feed'
import { setUser } from './sentry'

export interface UserProfileFollows extends UserProfile {
  i_follow: boolean
}

export interface PostPopulatedWithBetDetails extends PostPopulated {
  placed_bet_details: PlacedBetDetail
}

async function fetchProfile() {
  try {
    return await individualUser().get_profile_details()
  } catch (e) {
    Log({ error: e, from: '1 fetchProfile' }, 'error')
  }
}

type UnionKeyOf<U> = U extends U ? keyof U : never

export function sanitizeProfile(
  profile: UserProfileDetailsForFrontend,
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
    following_count: Number(profile.followers_count),
    profile_stats: {
      hots_earned_count: Number(profile.profile_stats.hots_earned_count) || 0,
      lifetime_earnings: Number(profile.profile_stats.hots_earned_count) || 0,
      nots_earned_count: Number(profile.profile_stats.hots_earned_count) || 0,
    },
    updated_at: Date.now(),
  }
}

export async function updateProfile(profile?: UserProfileDetailsForFrontend) {
  const authStateData = get(authState)
  if (authStateData.isLoggedIn) {
    const updateProfile = profile || (await fetchProfile())
    if (updateProfile) {
      userProfile.set({
        ...sanitizeProfile(updateProfile, authStateData.idString || 'random'),
      })
      if (updateProfile.unique_user_name[0]) {
        try {
          const { idb } = await import('$lib/idb')
          idb.set(
            'canisters',
            updateProfile.unique_user_name[0],
            authStateData.userCanisterId,
          )
        } catch (e) {
          Log({ error: e, from: '1 updateProfile', type: 'idb' }, 'error')
        }
      }
    } else {
      Log({ error: 'No profile found', from: '1 updateProfile' }, 'error')
    }
  } else {
    userProfile.set(emptyProfileValues)
  }
  updateUserProperties() // GA
  setUser(authStateData.idString) //Sentry
  Log({ profile: get(userProfile), from: '0 updateProfile' }, 'info')
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

    identifyUserGS({
      id: profile.principal_id,
      name: profile.display_name,
      ...(profile.username_set && { username: profile.unique_user_name }),
    })
  } else {
    setUserProperties()
    unidentifyUserGS()
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

export async function fetchPosts(
  id: string,
  from: number,
): Promise<ProfilePostsResponse> {
  try {
    const canId = await getCanisterId(id)

    const res = await individualUser(
      Principal.from(canId),
    ).get_posts_of_this_user_profile_with_pagination(
      BigInt(from),
      BigInt(from + 10),
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
    Log({ error: e, from: '11 fetchPosts' }, 'error')
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
    Log({ error: e, from: '11 fetchPosts' }, 'error')
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
            placed_bet_details: post,
            score: BigInt(0),
            created_by_user_principal_id:
              r.created_by_user_principal_id.toText(),
            publisher_canister_id: post.canister_id.toText(),
          } as PostPopulatedWithBetDetails
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
    Log({ error: e, from: '11 populatePosts.feed' }, 'error')
    return { error: true, posts: [] }
  }
}

export async function fetchLovers(id: string, from: number) {
  try {
    const canId = await getCanisterId(id)

    const res = await individualUser(
      Principal.from(canId),
    ).get_principals_that_follow_me_paginated(BigInt(from), BigInt(from + 15))
    if ('Ok' in res) {
      const populatedUsers = await populateProfiles(res.Ok)
      if (populatedUsers.error) {
        throw new Error(
          `Error while populating, ${JSON.stringify(populatedUsers)}`,
        )
      }
      return {
        error: false,
        lovers: populatedUsers.posts,
        noMoreLovers: res.Ok.length < 10,
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
          return { error: false, noMoreLovers: true, lovers: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log({ error: e, from: '11 fetchPosts' }, 'error')
    return { error: true }
  }
}

export async function fetchLovingUsers(id: string, from: number) {
  try {
    const canId = await getCanisterId(id)

    const res = await individualUser(
      Principal.from(canId),
    ).get_principals_i_follow_paginated(BigInt(from), BigInt(from + 15))
    if ('Ok' in res) {
      const populatedUsers = await populateProfiles(res.Ok)
      if (populatedUsers.error) {
        throw new Error(
          `Error while populating, ${JSON.stringify(populatedUsers)}`,
        )
      }
      return {
        error: false,
        lovers: populatedUsers.posts,
        noMoreLovers: res.Ok.length < 10,
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
          return { error: false, noMoreLovers: true, lovers: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log({ error: e, from: '11 fetchPosts' }, 'error')
    return { error: true }
  }
}

async function populateProfiles(users: Principal[]) {
  try {
    if (!users.length) {
      return { posts: [], error: false }
    }

    const authStateData = get(authState)

    const res = await Promise.all(
      users.map(async (userId) => {
        if (userId?.toText() === '2vxsx-fae') return
        const canId = await getCanisterId(userId.toText())

        if (canId) {
          const r = await individualUser(
            Principal.from(canId),
          ).get_profile_details()

          return {
            ...sanitizeProfile(r, userId.toText()),
            i_follow: authStateData.isLoggedIn
              ? await doIFollowThisUser(userId.toText())
              : false,
          }
        } else {
          Log(
            {
              error: `Could not get canisterId for user: ${userId.toText()}`,
              from: '12 populatePosts.profile',
            },
            'error',
          )
        }
      }),
    )

    return {
      posts: res.filter((o) => !!o) as UserProfileFollows[],
      error: false,
    }
  } catch (e) {
    Log({ error: e, from: '11 populatePosts.profile' }, 'error')
    return { error: true, posts: [] }
  }
}

export async function doIFollowThisUser(
  userId?: string,
  canId?: string | Principal,
) {
  if (!userId) return false

  return await individualUser(canId).get_following_status_do_i_follow_this_user(
    Principal.from(userId),
  )
}

export async function loveUser(userId: string) {
  try {
    const res =
      await individualUser().update_principals_i_follow_toggle_list_with_principal_specified(
        Principal.from(userId),
      )
    if ('Ok' in res) {
      return true
    } else {
      return false
    }
  } catch (e) {
    Log({ error: e, from: '1 loveUser' }, 'error')
    return false
  }
}

const walletEventDetails = ({} as WalletEvent)?.details
type UnionValueOf<U> = U extends U ? U[keyof U] : never
type WalletEvent = UnionValueOf<TokenEvent>
type WalletEventDetails = typeof walletEventDetails
type WalletEventSubType = UnionKeyOf<WalletEventDetails>
type WalletEventSubDetails = UnionValueOf<WalletEventDetails>

export interface TransactionHistory {
  id: BigInt
  type: UnionKeyOf<TokenEvent>
  token: number
  timestamp: SystemTime
  subType: WalletEventSubType
  details: WalletEventSubDetails
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

async function transformHistoryRecords(
  res: Array<[bigint, TokenEvent]>,
  filter?: UnionKeyOf<MintEvent>,
): Promise<TransactionHistory[]> {
  const history: TransactionHistory[] = []

  res.forEach((o) => {
    const event = o[1]
    const type = Object.keys(event)[0] as UnionKeyOf<TokenEvent>
    const subType = Object.keys(event[type].details)[0] as WalletEventSubType
    const details = Object.values(
      (event[type] as WalletEvent)?.details[subType] || {},
    )?.[0] as WalletEventSubDetails

    if (!filter || filter === subType) {
      history.push({
        id: o[0],
        type,
        subType,
        token: Object.values(o[1])?.[0]?.amount || 0,
        timestamp: event[type].timestamp as SystemTime,
        details,
      })
    }
  })

  return history
}

export async function setBetDetailToDb(
  post: PostPopulated,
  betDetail: PlacedBetDetail,
) {
  if (!post) return

  try {
    const idb = (await import('$lib/idb')).idb
    idb.set('bets', post.publisher_canister_id + '@' + post.post_id, betDetail)
  } catch (e) {
    Log({ error: e, source: '1 saveBetToDb', type: 'idb' }, 'error')
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
    Log({ error: e, from: '11 fetchHistory' }, 'error')
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
    Log({ error: e, from: '11 fetchHistory' }, 'error')
    return { error: true }
  }
}
