<script lang="ts">
import { page } from '$app/stores'
import Avatar from '@hnn/components/avatar/Avatar.svelte'
import IconButton from '@hnn/components/button/IconButton.svelte'
import Icon from '@hnn/components/icon/Icon.svelte'
import { registerEvent } from '@hnn/components/analytics/GA.utils'
import { individualUser } from '$lib/helpers/backend'
import { updatePostInWatchHistory, type PostPopulated } from '$lib/helpers/feed'
import { getThumbnailUrl } from '$lib/utils/cloudflare'
import Log from '$lib/utils/Log'
import { generateRandomName } from '$lib/utils/randomUsername'
import { getShortNumber } from '$lib/utils/shortNumber'
import { authState } from '$lib/stores/auth'
import { userProfile } from '$lib/stores/app'
import { debounce } from 'throttle-debounce'
import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte'
import { postReportPopup } from '$lib/stores/popups'

export let index: number
export let post: PostPopulated
export let showWalletLink = false
export let showReferAndEarnLink = false
export let showShareButton = false
export let showLikeButton = false
export let showReportButton = false
export let showHotOrNotButton = false
export let showDescription = false
export let watchHistoryDb: 'watch' | 'watch-hon'
export let source: 'hon_feed' | 'main_feed' | 'speculation' | 'post'

const dispatch = createEventDispatcher<{
  unavailable: void
}>()

let unavailable = false
let imgLoaded = false
let showTruncatedDescription = true
let watchProgress = {
  totalCount: 0,
  partialWatchedPercentage: 0,
}

$: displayName = post.created_by_display_name[0]
$: bettingStatus = post.hot_or_not_betting_status?.[0]
$: bettingStatusValue = Object.values(bettingStatus || {})?.[0]
$: postPublisherId =
  post.created_by_unique_user_name[0] || post.created_by_user_principal_id

async function fetchThumbnail() {
  try {
    const thumb = await fetch(getThumbnailUrl(post.video_uid, 80))
    if (thumb.status === 404) {
      unavailable = true
      dispatch('unavailable')
    } else {
      imgLoaded = true
    }
  } catch (_) {
    unavailable = true
  }
}

async function handleShare() {
  try {
    await navigator.share({
      title: 'Hot or Not',
      text: `Check out this hot video by ${displayName}. \n${post.description}`,
      url: `https://hotornot.wtf/feed/${post.publisher_canister_id}@${Number(
        post.id,
      )}`,
    })
  } catch (_) {}
  registerEvent('share_video', {
    source,
    userId: $userProfile.principal_id,
    video_publisher_id: postPublisherId,
    video_publisher_canister_id: post.publisher_canister_id,
    video_id: post.id,
  })
  await individualUser(
    post.publisher_canister_id,
  ).update_post_increment_share_count(post.id)
}

function recordView(percentageWatched: number) {
  if (percentageWatched < 2) {
    increaseWatchCount()
  } else {
    watchProgress.partialWatchedPercentage = percentageWatched
  }
}

const increaseWatchCount = debounce(500, () => {
  watchProgress.totalCount++
  watchProgress.partialWatchedPercentage = 0
  post.total_view_count = post.total_view_count + BigInt(1)
})

async function handleLike() {
  if (!$authState.isLoggedIn) {
    $authState.showLogin = true
    return
  }

  updatePostInWatchHistory(watchHistoryDb, post, {
    liked_by_me: !post.liked_by_me,
    like_count: post.like_count + BigInt(post.liked_by_me ? -1 : 1),
  })

  post = {
    ...post,
    liked_by_me: !post.liked_by_me,
    like_count: post.like_count + BigInt(post.liked_by_me ? -1 : 1),
  }

  registerEvent('like_video', {
    source,
    userId: $userProfile.principal_id,
    video_publisher_id:
      post.created_by_unique_user_name[0] ?? post.created_by_user_principal_id,
    video_publisher_canister_id: post.publisher_canister_id,
    video_id: post.id,
    likes: post.like_count,
  })

  try {
    await individualUser(
      post.publisher_canister_id,
    ).update_post_toggle_like_status_by_caller(post.id)
  } catch (e) {
    updatePostInWatchHistory(watchHistoryDb, post, {
      liked_by_me: post.liked_by_me,
      like_count: post.like_count,
    })

    post = {
      ...post,
      liked_by_me: post.liked_by_me,
      like_count: post.like_count,
    }
  }
}

async function updateStats() {
  if (
    watchProgress?.totalCount === 0 &&
    watchProgress?.partialWatchedPercentage === 0
  ) {
    return
  }

  updatePostInWatchHistory(watchHistoryDb, post)

  const payload =
    watchProgress.totalCount == 0
      ? {
          WatchedPartially: {
            percentage_watched: Math.min(
              Math.ceil(watchProgress.partialWatchedPercentage) || 1,
              100,
            ),
          },
        }
      : {
          WatchedMultipleTimes: {
            percentage_watched: Math.min(
              Math.ceil(watchProgress.partialWatchedPercentage) || 1,
              100,
            ),
            watch_count: watchProgress.totalCount,
          },
        }

  Log('info', 'Updating watch stats', {
    from: 'PlayerLayout.updateStats',
    id: post.id,
    i: index,
    payload,
  })

  if ($page.url.host.includes('t:')) return

  registerEvent('view_video', {
    source,
    userId: $userProfile.principal_id,
    video_publisher_id: postPublisherId,
    video_publisher_canister_id: post.publisher_canister_id,
    video_id: post.id,
    watch_count: Math.ceil(
      watchProgress.totalCount + watchProgress.partialWatchedPercentage / 100,
    ),
    home_feed_score: post.score,
  })
  try {
    await individualUser(
      post.publisher_canister_id,
    ).update_post_add_view_details(post.id, payload)
  } catch (e) {
    Log('warn', 'Could not update watch stats', {
      from: 'PlayerLayout.updateStats',
      i: index,
      payload,
      e,
    })
  }
}

onMount(() => fetchThumbnail())
</script>

{#if imgLoaded}
  <img
    alt="background"
    class="absolute inset-0 z-[1] h-full w-full origin-center object-cover blur-xl"
    src={getThumbnailUrl(post.video_uid, 80)} />
{/if}

<div
  style="background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%);"
  class="fade-in pointer-events-none absolute bottom-0 z-[10] block h-full w-full">
  <div
    style="-webkit-transform: translate3d(0, 0, 0);"
    class="absolute z-[10] flex w-screen space-x-2 pl-4 pr-2
          {$$slots.hotOrNot ? 'bottom-40' : 'bottom-20'}">
    <div class="flex grow flex-col justify-end space-y-4">
      <div
        aria-roledescription="video-info"
        class="pointer-events-auto flex space-x-3">
        <a href="/profile/{postPublisherId}" class="h-12 w-12 shrink-0">
          <Avatar class="h-12 w-12" src={post.created_by_profile_photo_url} />
        </a>
        <div class="flex flex-col space-y-1">
          <a href="/profile/{postPublisherId}">
            {displayName ||
              generateRandomName('name', post.created_by_user_principal_id)}
          </a>
          <div class="flex items-center space-x-1">
            <Icon name="eye-open" class="h-4 w-4 text-white" />
            <span class="text-sm">{Number(post.total_view_count)}</span>
          </div>
        </div>
      </div>
      {#if showDescription}
        <button
          class:max-h-10={showTruncatedDescription}
          on:click|stopImmediatePropagation={(e) => {
            showTruncatedDescription = !showTruncatedDescription
          }}
          class="pointer-events-auto truncate text-ellipsis whitespace-normal text-left text-sm">
          {post.description}
        </button>
      {/if}
      <slot name="betRoomInfo" />
    </div>

    <div
      class="pointer-events-auto flex max-w-16 shrink-0 flex-col items-end justify-end space-y-6 pb-2">
      {#if showReportButton}
        <IconButton
          title="Report"
          iconName="flag"
          iconClass="h-6 w-6 text-white drop-shadow-md"
          ariaLabel="Report this post"
          on:click={(e) => {
            e.stopImmediatePropagation()
            postReportPopup.set({
              show: true,
              data: {
                postCanisterId: post.publisher_canister_id,
                postId: post.id.toString(),
                videoUid: post.video_uid,
                postUploadedByUserId: post.created_by_user_principal_id,
                reportedByUserId: $authState.idString || '2vxsx-fae',
              },
            })
          }} />
      {/if}

      {#if showReferAndEarnLink}
        <IconButton
          title="Refer & Earn"
          iconName="giftbox-fill"
          iconClass="h-7 w-7"
          ariaLabel="Share this post"
          href="/refer-earn" />
      {/if}
      {#if showLikeButton}
        <div class="flex flex-col">
          <IconButton
            title="Like"
            iconName={post.liked_by_me && $authState.isLoggedIn
              ? 'heart-fill-color'
              : 'heart-fill'}
            iconClass="h-8 w-8"
            ariaLabel="Toggle like on this post"
            on:click={(e) => {
              e.stopImmediatePropagation()
              handleLike()
            }} />
          <span class="text-center text-sm drop-shadow-md">
            {getShortNumber(Number(post.like_count))}
          </span>
        </div>
      {/if}
      {#if showWalletLink}
        <IconButton
          title="Wallet"
          iconName="wallet-fill"
          iconClass="h-6 w-6 text-white drop-shadow-md"
          ariaLabel="Wallet"
          href="/wallet" />
      {/if}
      {#if showShareButton}
        <IconButton
          title="Share"
          iconName="share-message"
          iconClass="h-6 w-6 drop-shadow-md"
          on:click={(e) => {
            e.stopImmediatePropagation()
            handleShare()
          }} />
      {/if}
      {#if showHotOrNotButton}
        <IconButton
          title="Hot or Not"
          iconName="fire"
          iconClass="h-5 w-5"
          ariaLabel="Check out this post in Hot or Not"
          disabled={!bettingStatusValue}
          href={`/hotornot/${post.publisher_canister_id}@${post.id}`}
          class="rounded-full border-[0.15rem] border-[#FA9301] bg-gradient-to-b from-[#F63700] to-[#FFC848] p-2" />
      {/if}
    </div>
  </div>
  {#if $$slots.hotOrNot}
    <div
      style="-webkit-transform: translate3d(0, 0, 0);"
      class="absolute inset-x-0 bottom-0 z-[5] h-40 w-full">
      <slot name="hotOrNot" />
    </div>
  {/if}
</div>
<slot {recordView} {updateStats} {unavailable} />
