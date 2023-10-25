export const ssr = false
export const prerender = false

import { Principal } from '@dfinity/principal'
import type { PageLoad } from './$types'
import type { PostPopulated } from '$lib/helpers/feed'
import { individualUser } from '$lib/helpers/backend'
import Log from '$lib/utils/Log'

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const id = params.id.split('@')
    const postId = BigInt(Number(id[1]))
    const principal = Principal.from(id[0])
    let cachedPost: PostPopulated | undefined = undefined

    try {
      const { idb } = await import('$lib/idb')
      cachedPost = await idb.get('watch', params.id)
    } catch (e) {
      Log('error', 'Error while accessing IDB', {
        error: e,
        from: 'feedLoad',
        type: 'idb',
      })
      cachedPost = undefined
    }

    if (cachedPost) {
      return { post: cachedPost }
    } else {
      const r = await individualUser(
        principal,
        fetch,
      ).get_individual_post_details_by_id(postId)
      if (r.video_uid) {
        return {
          post: {
            ...r,
            publisher_canister_id: id[0],
            created_by_user_principal_id:
              r.created_by_user_principal_id.toText(),
            post_id: postId,
            score: BigInt(0),
          } as PostPopulated,
        }
      } else {
        return
      }
    }
  } catch (e) {
    return
  }
}
