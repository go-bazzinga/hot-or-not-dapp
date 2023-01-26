import type { PostDetailsForFrontend } from '$canisters/individual_user_template/individual_user_template.did';
import type { PostScoreIndexItem, TopPostsFetchError } from '$canisters/post_cache/post_cache.did';
import Log from '$lib/utils/Log';
import { Principal } from '@dfinity/principal';
import { individualUser, postCache } from './backend';

export interface PostPopulated
	extends Omit<PostScoreIndexItem, 'publisher_canister_id'>,
		Omit<PostDetailsForFrontend, 'created_by_user_principal_id'> {
	created_by_user_principal_id: string;
	publisher_canister_id: string;
}

export interface PostPopulatedHistory extends PostPopulated {
	watched_at: number;
}

export type FeedResponse =
	| {
			posts: PostPopulated[];
			error: false;
			from: number;
			noMorePosts: boolean;
	  }
	| {
			error: true;
	  };

async function filterPosts(posts: PostScoreIndexItem[]): Promise<PostScoreIndexItem[]> {
	try {
		const { watchHistoryIdb } = await import('$lib/utils/idb');
		const keys = (await watchHistoryIdb.keys()) as string[];
		if (!keys.length) return posts;
		const filtered = posts.filter(
			(o) => !keys.includes(o.publisher_canister_id.toText() + '@' + o.post_id)
		);
		if (keys.length > 100) {
			Log(
				{ message: 'More than 100 posts. Keeping only most recent ones', from: 'filterPost' },
				'info'
			);
			const values = await watchHistoryIdb.values();
			await watchHistoryIdb.clear();
			if (values) {
				const sliced = values.sort((a, b) => b.watched_at - a.watched_at).slice(50);
				sliced.forEach((post) =>
					watchHistoryIdb.set(post.publisher_canister_id + '@' + post.post_id, post)
				);
				Log(
					{
						message: 'Cleared cache and restored only most recent watched videos',
						from: 'filterPost'
					},
					'info'
				);
			}
		}
		return filtered;
	} catch (e) {
		Log({ error: e, from: '1 filterPosts', type: 'idb' }, 'error');
		return posts;
	}
}

export async function getWatchedVideosFromCache(): Promise<PostPopulatedHistory[]> {
	try {
		const { watchHistoryIdb } = await import('$lib/utils/idb');
		const values = (await watchHistoryIdb.values()) as PostPopulatedHistory[];
		if (!values.length) return [];
		const sorted = values.sort((a, b) => a.watched_at - b.watched_at);
		return sorted;
	} catch (e) {
		Log({ error: e, from: '1 getWatchedVideosFromCache', type: 'idb' }, 'error');
		return [];
	}
}

export async function getTopPosts(
	from: number,
	numberOfPosts: number = 10,
	filterViewed = false
): Promise<FeedResponse> {
	try {
		const res =
			await postCache().get_top_posts_aggregated_from_canisters_on_this_network_for_home_feed(
				BigInt(from),
				BigInt(from + numberOfPosts)
			);
		if ('Ok' in res) {
			const filteredPosts = await filterPosts(res.Ok);
			const populatedRes = await populatePosts(filterViewed ? filteredPosts : res.Ok);
			if (populatedRes.error) {
				throw new Error(`Error while populating, ${JSON.stringify(populatedRes)}`);
			}
			return {
				error: false,
				from: from + res.Ok.length,
				posts: populatedRes.posts,
				noMorePosts: res.Ok.length < numberOfPosts
			};
		} else if ('Err' in res) {
			type UnionKeyOf<U> = U extends U ? keyof U : never;
			type errors = UnionKeyOf<TopPostsFetchError>;
			const err = Object.keys(res.Err)[0] as errors;
			switch (err) {
				case 'InvalidBoundsPassed':
				case 'ExceededMaxNumberOfItemsAllowedInOneRequest':
					return { error: true };
				case 'ReachedEndOfItemsList':
					return { error: false, noMorePosts: true, from, posts: [] };
			}
		} else throw new Error(`Unknown response, ${JSON.stringify(res)}`);
	} catch (e) {
		Log({ error: e, from: '11 getTopPosts' }, 'error');
		return { error: true };
	}
}

export async function getHotOrNotPosts(
	from: number,
	numberOfPosts: number = 10
): Promise<FeedResponse> {
	try {
		const res =
			await postCache().get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed(
				BigInt(from),
				BigInt(from + numberOfPosts)
			);
		if ('Ok' in res) {
			const populatedRes = await populatePosts(res.Ok);
			if (populatedRes.error) {
				throw new Error(`Error while populating, ${JSON.stringify(populatedRes)}`);
			}
			return {
				error: false,
				from: from + res.Ok.length,
				posts: populatedRes.posts,
				noMorePosts: res.Ok.length < numberOfPosts
			};
		} else if ('Err' in res) {
			type UnionKeyOf<U> = U extends U ? keyof U : never;
			type errors = UnionKeyOf<TopPostsFetchError>;
			const err = Object.keys(res.Err)[0] as errors;
			switch (err) {
				case 'InvalidBoundsPassed':
				case 'ExceededMaxNumberOfItemsAllowedInOneRequest':
					return { error: true };
				case 'ReachedEndOfItemsList':
					return { error: false, noMorePosts: true, from, posts: [] };
			}
		} else throw new Error(`Unknown response, ${JSON.stringify(res)}`);
	} catch (e) {
		Log({ error: e, from: '11 getTopPosts' }, 'error');
		return { error: true };
	}
}

async function populatePosts(posts: PostScoreIndexItem[]) {
	try {
		if (!posts.length) {
			return { posts: [], error: false };
		}

		const res = await Promise.all(
			posts.map(async (post) => {
				try {
					const r = await individualUser(
						Principal.from(post.publisher_canister_id)
					).get_individual_post_details_by_id(post.post_id);
					return {
						...r,
						...post,
						created_by_user_principal_id: r.created_by_user_principal_id.toText(),
						publisher_canister_id: post.publisher_canister_id.toText()
					};
				} catch (_) {
					return undefined;
				}
			})
		);
		return { posts: res.filter((o) => !!o) as PostPopulated[], error: false };
	} catch (e) {
		Log({ error: e, from: '11 populatePosts.feed' }, 'error');
		return { error: true, posts: [] };
	}
}

export async function getFirstPost(id: string) {
	const split = id.split('@');
	const postId = BigInt(Number(split[1]));
	const principal = Principal.from(split[0]);
	let cachedPost: PostPopulated | undefined = undefined;

	try {
		const { watchHistoryIdb } = await import('$lib/utils/idb');
		cachedPost = await watchHistoryIdb.get(id);
	} catch (e) {
		Log({ error: e, source: '1 videoFeedLoad', type: 'idb' }, 'error');
	}

	if (cachedPost) {
		return { post: cachedPost };
	} else {
		const r = await individualUser(principal, fetch).get_individual_post_details_by_id(postId);
		if (r.video_uid) {
			return {
				post: {
					...r,
					publisher_canister_id: split[0],
					created_by_user_principal_id: r.created_by_user_principal_id.toText(),
					post_id: postId,
					score: BigInt(0)
				} as PostPopulated
			};
		} else {
			return;
		}
	}
}
