<script lang="ts">
import HomeLayout from '@hnn/components/web-client/layout/HomeLayout.svelte'
import BottomNavigation from '@hnn/components/web-client/navigation/BottomNavigation.svelte'
import Selector from '@hnn/components/home/Selector.svelte'
import { page } from '$app/stores'
import { playerState } from '$lib/stores/app'
import { onDestroy, onMount } from 'svelte'
import { authState, loadingAuthStatus } from '$lib/stores/auth'
import { browser } from '$app/environment'
import { showMigrationPopup } from '$lib/stores/popups'
import MigrationPopup from '@hnn/components/popup/MigrationPopup.svelte'

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    $playerState.visible = false
  } else {
    $playerState.visible = true
  }
}

onMount(async () => {
  if (browser) {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})

onDestroy(() => {
  if (browser) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})

$: pathname = $page.url.pathname

$: showPopup =
  $showMigrationPopup && !$loadingAuthStatus && !$authState.isMigrated
</script>

<HomeLayout>
  <svelte:fragment slot="top">
    {#if pathname.includes('feed') || pathname.includes('hotornot')}
      <Selector
        feedUrl={$playerState.currentFeedUrl == 'no-videos'
          ? ''
          : $playerState.currentFeedUrl}
        hotOrNotUrl={$playerState.currentHotOrNotUrl == 'no-videos'
          ? ''
          : $playerState.currentFeedUrl}
        selected={pathname.includes('feed') ? 'videos' : 'hot-or-not'} />
    {:else if pathname.includes('menu')}
      <div
        class="flex w-full items-center justify-center bg-black py-4 shadow-xl shadow-black/50">
        Menu
      </div>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="content">
    <slot />
  </svelte:fragment>
  <div class="w-full" slot="bottom-navigation">
    {#if !pathname.includes('hotornot')}
      <BottomNavigation
        feedUrl={$playerState.currentFeedUrl == 'no-videos'
          ? ''
          : $playerState.currentFeedUrl}
        pathName={$page.url.pathname} />
    {/if}
  </div>
</HomeLayout>

{#if showPopup}
  <MigrationPopup on:click={() => showMigrationPopup.set(false)} />
{/if}
