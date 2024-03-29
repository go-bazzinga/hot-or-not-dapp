import {
  query,
  collection,
  getDocs,
  limit,
  orderBy,
  Query,
  startAfter,
  getDoc,
  doc,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  CollectionName,
  DislikeRecord,
  LikeRecord,
  UpDownPost,
} from './db.types'
import { getDb } from '$lib/db'
import type { IDBStores } from '$lib/idb/idb'
import { get } from 'svelte/store'
import { authState } from '$lib/stores/auth'

export async function getVideos(
  lastRef?: QueryDocumentSnapshot,
  keepId?: string,
) {
  try {
    const videos: UpDownPost[] = []
    const db = getDb()
    let q: Query

    if (lastRef) {
      q = query(
        collection(db, 'ud-videos' as CollectionName),
        orderBy('created_at', 'desc'),
        startAfter(lastRef),
        limit(50),
      )
    } else {
      q = query(
        collection(db, 'ud-videos' as CollectionName),
        orderBy('created_at', 'desc'),
        limit(50),
      )
    }
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return { ok: true, videos, more: false }
    }

    const alreadyWatchedPosts = await getAlreadyWatchedPostsIds(
      'up-down-watch-history',
    )

    snapshot.forEach((doc) => {
      if (!alreadyWatchedPosts.includes(doc.id) || doc.id === keepId) {
        videos.push({ ...doc.data(), id: doc.id } as UpDownPost)
      }
    })

    return {
      ok: true,
      videos,
      lastRef: snapshot.docs[snapshot.docs.length - 1],
      more: true,
    }
  } catch (e) {
    console.log('Error fetching videos', e)
    return { ok: false }
  }
}

async function getAlreadyWatchedPostsIds(
  dbStore: IDBStores,
): Promise<string[]> {
  try {
    const idb = (await import('$lib/idb')).idb
    const keys = (await idb.keys(dbStore)) as string[]
    if (!keys?.length) return []
    return keys
  } catch (e) {
    console.error('Error while accessing IDB', {
      error: e,
      from: 'getAlreadyWatchedPostsIds',
      type: 'idb',
    })
    return []
  }
}

export async function getLikeDislikeStatus(postId: string) {
  try {
    const db = getDb()
    const authStateData = get(authState)
    if (!authStateData.isLoggedIn) {
      return {
        disliked: false,
        liked: false,
      }
    }

    const likeDoc = (
      await getDoc(doc(db, `ud-videos/${postId}/likes/${authStateData.userId}`))
    ).data() as LikeRecord

    const dislikeDoc = (
      await getDoc(
        doc(db, `ud-videos/${postId}/dislikes/${authStateData.userId}`),
      )
    ).data() as DislikeRecord

    return {
      disliked: dislikeDoc && dislikeDoc.disliked,
      liked: likeDoc && likeDoc.liked,
    }
  } catch (e) {
    return {
      disliked: false,
      liked: false,
    }
  }
}
