<script lang="ts">
import { beforeNavigate } from '$app/navigation'
import Button from '$components/button/Button.svelte'
import PlayerLayout from '$components/layout/PlayerLayout.svelte'
import HotOrNotVote from '$components/hot-or-not/HotOrNotVote.svelte'
import VideoPlayer from '$components/video/VideoPlayer.svelte'
import {
  getHotOrNotPosts,
  updatePostInWatchHistory,
  type PostPopulated,
} from '$lib/helpers/feed'
import { updateURL } from '$lib/utils/feedUrl'
import Log from '$lib/utils/Log'
import { handleParams } from '$lib/utils/params'
import { joinArrayUniquely } from '$lib/utils/video'
import { hotOrNotFeedVideos, playerState } from '$stores/playerState'
import { removeSplashScreen } from '$stores/popups'
import { onMount, tick } from 'svelte'
import HotOrNotRoomInfo from '$components/hot-or-not/HotOrNotRoomInfo.svelte'
import type { PageData } from './$types'
import Icon from '$components/icon/Icon.svelte'
import PlayerRenderer from '$components/video/PlayerRenderer.svelte'
import { debounce } from 'throttle-debounce'

export let data: PageData

const fetchCount = 25
const fetchWhenVideosLeft = 10
const keepVideosLoadedCount: number = 3

let videos: PostPopulated[] = []
let currentVideoIndex = 0
let noMoreVideos = false
let loading = true
let fetchedVideosCount = 0

let loadTimeout: ReturnType<typeof setTimeout> | undefined = undefined
let errorCount = 0
let showError = false

async function fetchNextVideos(force = false) {
  // console.log(
  // 	`to fetch: ${!noMoreVideos} && ${
  // 		videos.length
  // 	} - ${currentVideoIndex}<${fetchCount}, errorCount: ${errorCount}`
  // );
  if (
    !noMoreVideos &&
    (force || videos.length - currentVideoIndex < fetchWhenVideosLeft)
  ) {
    try {
      Log('info', 'Fetching videos for feed', {
        res: 'fetching from ' + fetchedVideosCount,
        source: 'hotOrNot.fetchNextVideos',
      })
      loading = true
      const res = await getHotOrNotPosts(fetchedVideosCount, fetchCount)
      if (res.error) {
        if (errorCount < 4) {
          loadTimeout = setTimeout(() => {
            errorCount++
            fetchNextVideos()
          }, 5000)
        } else {
          clearTimeout(loadTimeout)
          showError = true
        }
        return
      } else {
        errorCount = 0
        if (loadTimeout) clearTimeout(loadTimeout)
      }

      fetchedVideosCount = res.from

      videos = joinArrayUniquely(videos, res.posts)

      console.log({ videos })

      if (res.noMorePosts) {
        noMoreVideos = res.noMorePosts
        // const watchedVideos = await getWatchedVideosFromCache('watch-hon')
        // videos = joinArrayUniquely(videos, watchedVideos)
      } else if (!res.noMorePosts && res.posts.length < fetchCount - 10) {
        fetchNextVideos(true)
      }

      await tick()

      Log('info', 'Fetched videos for feed', {
        noMoreVideos,
        from: res.from,
        fetchedCount: res.posts.length,
        source: 'hotOrNot.fetchNextVideos',
      })
    } catch (e) {
      Log('warn', 'Could not fetch videos for feed', {
        error: e,
        noMoreVideos,
        source: 'hotOrNot.fetchNextVideos',
      })
    } finally {
      loading = false
    }
  }
}

const handleChange = debounce(250, (newIndex: number) => {
  currentVideoIndex = newIndex
  fetchNextVideos()
  updateURL(videos[currentVideoIndex])
})

async function handleUnavailableVideo(index: number) {
  videos.splice(index, 1)
  videos = videos
}

onMount(async () => {
  updateURL()
  $playerState.initialized = false
  $playerState.muted = true
  $playerState.visible = true
  if (data?.post) {
    videos = [data.post, ...videos]
    updatePostInWatchHistory('watch-hon', data.post)
  } else if ($hotOrNotFeedVideos.length) {
    videos = $hotOrNotFeedVideos
    $hotOrNotFeedVideos = []
  }
  await tick()
  fetchNextVideos()
  handleParams()
})

beforeNavigate(() => {
  $playerState.visible = false
  $playerState.muted = true
  videos.length > 2 && hotOrNotFeedVideos.set(videos.slice(currentVideoIndex))
})
</script>

<svelte:head>
  <title>Hot or Not Videos | Hot or Not</title>
</svelte:head>

<div
  style="height: 100dvh;"
  class="hide-scrollbar relative flex w-full snap-y snap-mandatory flex-col overflow-hidden overflow-y-auto">
  {#each videos as post, index (index)}
    <PlayerRenderer
      {keepVideosLoadedCount}
      {index}
      activeIndex={currentVideoIndex}
      let:show>
      <PlayerLayout
        bind:post
        {index}
        {show}
        source="hon_feed"
        watchHistoryDb="watch-hon"
        showWalletLink
        showReportButton
        showExperimentsButton
        let:recordView
        let:updateStats
        on:view={({ detail }) => handleChange(detail)}>
        <VideoPlayer
          on:watchComplete={updateStats}
          on:loaded={() => removeSplashScreen()}
          on:watchedPercentage={({ detail }) => recordView(detail)}
          on:videoUnavailable={() => handleUnavailableVideo(index)}
          {index}
          playFormat="hls"
          inView={index == currentVideoIndex && $playerState.visible}
          uid={post.video_uid} />
        <svelte:fragment slot="betRoomInfo">
          {#if post.hot_or_not_betting_status[0]}
            <HotOrNotRoomInfo
              bettingStatus={post.hot_or_not_betting_status[0]} />
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="hotOrNot">
          <HotOrNotVote
            me
            bind:post
            inView={index == currentVideoIndex && $playerState.visible} />
        </svelte:fragment>
      </PlayerLayout>
    </PlayerRenderer>
  {/each}
  {#if showError}
    <div
      class="relative flex h-screen w-full shrink-0 snap-center snap-always flex-col items-center justify-center space-y-8 px-8">
      <div class="text-center text-lg font-bold">
        Error loading posts. Please, refresh the page.
      </div>
      <Button
        type="primary"
        on:click={(e) => e.preventDefault()}
        href="/hotornot">
        Clear here to refresh
      </Button>
    </div>
  {/if}
  {#if loading}
    <div
      class="relative flex h-screen w-full shrink-0 snap-center snap-always flex-col items-center justify-center space-y-8 px-8">
      <div class="text-center text-lg font-bold">Loading</div>
    </div>
  {/if}
  {#if noMoreVideos}
    <div
      class="relative flex h-screen w-full shrink-0 snap-center snap-always flex-col items-center justify-center space-y-8 px-8">
      <Icon name="votes-graphics" class="w-56" />
      <div class="text-center text-lg font-bold">
        There are no more videos to vote on
      </div>
      <div class="absolute inset-x-0 bottom-20 z-[-1] max-h-48">
        <HotOrNotVote disabled />
      </div>
    </div>
  {/if}
</div>