import type { PostDetailsForFrontend } from '@hnn/declarations/individual_user_template/individual_user_template.did'
import type {
  PostScoreIndexItemV1,
  TopPostsFetchError,
} from '@hnn/declarations/post_cache/post_cache.did'
import type { IDB } from '$lib/idb'
import Log from '$lib/utils/Log'
import { Principal } from '@dfinity/principal'
import { individualUser, postCache } from './backend'
import { setBetDetailToDb } from './profile'
import sleep from '$lib/utils/sleep'
import { chunk } from '$lib/utils/chunk'
import getDefaultImageUrl from '$lib/utils/getDefaultImageUrl'
import { get } from 'svelte/store'
import { appPrefs } from '$lib/stores/app'

export interface PostPopulated
  extends Omit<PostScoreIndexItemV1, 'publisher_canister_id' | 'created_at'>,
    Omit<
      PostDetailsForFrontend,
      'created_by_user_principal_id' | 'created_by_profile_photo_url'
    > {
  created_by_user_principal_id: string
  created_by_profile_photo_url: string
  publisher_canister_id: string
}

let idb: IDB | null = null

export interface PostPopulatedHistory extends PostPopulated {
  watched_at: number
}

export type FeedResponse =
  | {
      posts: PostPopulated[]
      error: false
      from: number
      noMorePosts: boolean
    }
  | {
      error: true
    }

async function filterPosts(
  posts: PostScoreIndexItemV1[],
  dbStore: 'watch' | 'watch-hon',
): Promise<PostScoreIndexItemV1[]> {
  try {
    if (!idb) {
      idb = (await import('$lib/idb')).idb
    }
    const keys = (await idb.keys(dbStore)) as string[]
    if (!keys?.length) return posts
    const filtered = posts.filter(
      (o) => !keys.includes(o.publisher_canister_id.toText() + '@' + o.post_id),
    )
    return filtered
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'feed.filterPosts',
      type: 'idb',
    })
    return posts
  }
}

async function filterReportedPosts(posts: PostScoreIndexItemV1[]) {
  try {
    if (!idb) {
      idb = (await import('$lib/idb')).idb
    }
    const keys = (await idb.keys('reported')) as string[]
    if (!keys?.length) return posts
    const filtered = posts.filter(
      (o) => !keys.includes(o.publisher_canister_id.toText() + '@' + o.post_id),
    )
    return filtered
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'feed.filterReportedPosts',
      type: 'idb',
    })
    return posts
  }
}

export async function getWatchedVideosFromCache(
  dbStore: 'watch' | 'watch-hon',
): Promise<PostPopulatedHistory[]> {
  try {
    if (!idb) {
      idb = (await import('$lib/idb')).idb
    }
    const values = ((await idb.values(dbStore)) || []).slice(
      50,
    ) as PostPopulatedHistory[]
    if (!values.length) return []
    const sorted = values.sort((a, b) => a.watched_at - b.watched_at)
    return sorted
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'feed.getWatchedVideosFromCache',
      type: 'idb',
    })
    return []
  }
}

export async function getTopPosts(
  from: number,
  numberOfPosts: number = 10,
  filterViewed = false,
  showNsfw = false,
): Promise<FeedResponse> {
  try {
    const res =
      await postCache().get_top_posts_aggregated_from_canisters_on_this_network_for_home_feed_cursor(
        BigInt(from),
        BigInt(numberOfPosts),
        [],
        [],
        [
          showNsfw
            ? {
                IncludeNsfw: null,
              }
            : {
                ExcludeNsfw: null,
              },
        ],
      )
    if ('Ok' in res) {
      const nonReportedPosts = await filterReportedPosts(res.Ok)
      const notWatchedPosts = await filterPosts(nonReportedPosts, 'watch')
      const populatedRes = await populatePosts(
        filterViewed ? notWatchedPosts : nonReportedPosts,
      )
      if (populatedRes.error) {
        throw new Error(
          `Error while populating, ${JSON.stringify(populatedRes)}`,
        )
      }
      return {
        error: false,
        from: from + res.Ok.length,
        posts: populatedRes.posts,
        noMorePosts: res.Ok.length < numberOfPosts,
      }
    } else if ('Err' in res) {
      type UnionKeyOf<U> = U extends U ? keyof U : never
      type errors = UnionKeyOf<TopPostsFetchError>
      const err = Object.keys(res.Err)[0] as errors
      switch (err) {
        case 'InvalidBoundsPassed':
        case 'ExceededMaxNumberOfItemsAllowedInOneRequest':
          return { error: true }
        case 'ReachedEndOfItemsList':
          return { error: false, noMorePosts: true, from, posts: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log('warn', 'Error while loading posts', {
      error: e,
      from: 'feed.getTopPosts',
    })
    return { error: true }
  }
}

async function filterBets(
  posts: PostScoreIndexItemV1[],
): Promise<PostScoreIndexItemV1[]> {
  try {
    if (!idb) {
      idb = (await import('$lib/idb')).idb
    }
    const keys = (await idb.keys('bets')) as string[]
    if (!keys?.length) return posts
    const filtered = posts.filter(
      (o) => !keys.includes(o.publisher_canister_id.toText() + '@' + o.post_id),
    )
    return filtered
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'feed.filterPosts',
      type: 'idb',
    })
    return posts
  }
}

export async function getHotOrNotPosts(
  from: number,
  numberOfPosts: number = 10,
  showNsfw = false,
): Promise<FeedResponse> {
  try {
    postCache().get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_cursor(
      BigInt(1),
      BigInt(2),
      [],
      [],
      [],
    )
    const res =
      await postCache().get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_cursor(
        BigInt(from),
        BigInt(numberOfPosts),
        [],
        [],
        [
          showNsfw
            ? {
                IncludeNsfw: null,
              }
            : {
                ExcludeNsfw: null,
              },
        ],
      )
    if ('Ok' in res) {
      const notBetPosts = await filterBets(res.Ok)
      const notReportedPosts = await filterReportedPosts(notBetPosts)
      const notWatchedPosts = await filterPosts(notReportedPosts, 'watch-hon')
      const populatedRes = await populatePosts(notWatchedPosts, false)
      if (populatedRes.error) {
        throw new Error(
          `Error while populating, ${JSON.stringify(populatedRes)}`,
        )
      }
      return {
        error: false,
        from: from + res.Ok.length,
        posts: populatedRes.posts,
        noMorePosts: res.Ok.length < numberOfPosts,
      }
    } else if ('Err' in res) {
      type UnionKeyOf<U> = U extends U ? keyof U : never
      type errors = UnionKeyOf<TopPostsFetchError>
      const err = Object.keys(res.Err)[0] as errors
      switch (err) {
        case 'InvalidBoundsPassed':
        case 'ExceededMaxNumberOfItemsAllowedInOneRequest':
          return { error: true }
        case 'ReachedEndOfItemsList':
          return { error: false, noMorePosts: true, from, posts: [] }
      }
    } else throw new Error(`Unknown response, ${JSON.stringify(res)}`)
  } catch (e) {
    Log('warn', 'Error while loading posts', {
      error: e,
      from: 'feed.getHotOrNotPosts',
    })
    return { error: true }
  }
}

export function isBettingClosed(post: PostDetailsForFrontend) {
  const bettingStatus = post.hot_or_not_betting_status?.[0]
  const bettingStatusValue = Object.values(bettingStatus || {})?.[0]
  if (!bettingStatusValue) {
    return true
  }
  const betWillCloseAt = new Date(
    Number(bettingStatusValue.started_at.secs_since_epoch) * 1000,
  )
  betWillCloseAt.setHours(betWillCloseAt.getHours() + 48)
  if (betWillCloseAt.getTime() - new Date().getTime() > 0) {
    return false
  }
  return true
}

function hasUserBetOnPost(post: PostDetailsForFrontend) {
  const bettingStatus = post.hot_or_not_betting_status?.[0]
  const bettingStatusValue = Object.values(bettingStatus || {})?.[0]

  if (!bettingStatusValue) {
    return true
  }
  if (bettingStatusValue.has_this_user_participated_in_this_post[0]) {
    return true
  }
  return false
}

async function fetchPostDetailById(
  post: PostScoreIndexItemV1,
  excludeIfBetClosed = false,
  excludeIfNsfw = true,
) {
  try {
    const r = await individualUser(
      Principal.from(post.publisher_canister_id),
    ).get_individual_post_details_by_id(post.post_id)
    if (excludeIfBetClosed && (hasUserBetOnPost(r) || isBettingClosed(r))) {
      Log('warn', "Already bet on post or bet's been closed", {
        post,
        from: 'feed.populatePosts.fetch',
      })
      setBetDetailToDb({
        ...r,
        ...post,
        created_at: r.created_at,
        created_by_user_principal_id: r.created_by_user_principal_id.toText(),
        publisher_canister_id: post.publisher_canister_id.toText(),
        created_by_profile_photo_url:
          r.created_by_profile_photo_url[0] ||
          getDefaultImageUrl(r.created_by_user_principal_id, 54),
      } satisfies PostPopulated)
      return undefined
    }
    if (excludeIfNsfw && r.is_nsfw) {
      return undefined
    }
    return {
      ...r,
      ...post,
      created_at: r.created_at,
      created_by_user_principal_id: r.created_by_user_principal_id.toText(),
      publisher_canister_id: post.publisher_canister_id.toText(),
      created_by_profile_photo_url:
        r.created_by_profile_photo_url[0] ||
        getDefaultImageUrl(r.created_by_user_principal_id, 54),
    } satisfies PostPopulated
  } catch (e) {
    Log('warn', 'Error while populating post', {
      error: e,
      post,
      from: 'feed.populatePosts.fetch',
    })
    return undefined
  }
}

async function populatePosts(
  posts: PostScoreIndexItemV1[],
  filterBetPosts = false,
) {
  try {
    if (!posts.length) {
      return { posts: [], error: false }
    }

    const appPrefsData = get(appPrefs)

    const populatedPosts: PostPopulated[] = []

    const chunkedPosts = chunk(posts, 10)
    while (chunkedPosts.length) {
      const batch = chunkedPosts.shift()
      if (batch) {
        const results = await Promise.all(
          batch.map((post) =>
            fetchPostDetailById(
              post,
              filterBetPosts,
              !appPrefsData?.showNsfwVideos,
            ),
          ),
        )
        populatedPosts.push(...(results.filter((o) => !!o) as PostPopulated[]))
        await sleep(200)
      }
    }

    return {
      posts: populatedPosts,
      error: false,
    }
  } catch (e) {
    Log('warn', 'Error while loading posts', {
      error: e,
      from: 'feed.populatePosts',
    })
    return { error: true, posts: [] }
  }
}

export async function updatePostInWatchHistory(
  store: 'watch-hon' | 'watch',
  post: PostPopulated,
  update?: Partial<PostPopulated>,
) {
  if (!post) return
  const postHistory: PostPopulatedHistory = {
    ...post,
    ...update,
    watched_at: Date.now(),
  }
  try {
    if (!idb) {
      idb = (await import('$lib/idb')).idb
    }
    await idb.set(
      store,
      post.publisher_canister_id + '@' + post.post_id,
      postHistory,
    )
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'feed.updatePostInWatchHistory',
      type: 'idb',
    })
  }
}

export async function saveReportedPostInDb(postId: string, reason: string) {
  try {
    if (!idb) {
      idb = (await import('$lib/idb')).idb
    }
    await idb.set('reported', postId, reason)
  } catch (e) {
    Log('warn', 'Error while accessing IDB', {
      error: e,
      from: 'feed.saveReportedPostInDb',
      type: 'idb',
    })
  }
}
