<script lang="ts">
import '@hnn/components/tailwind.css'
import { onDestroy, onMount } from 'svelte'
import { authState } from '$lib/stores/auth'
import LoginPopup from '$lib/components/auth/LoginPopup.svelte'
import Log from '$lib/utils/Log'
import { beforeNavigate } from '$app/navigation'
import { navigateBack, navigationHistory } from '$lib/stores/navigation'
import { registerEvent } from '@hnn/components/analytics/GA.utils'
import { userProfile } from '$lib/stores/app'
import { initializeAuthClient } from '$lib/helpers/auth'
import { page } from '$app/stores'
import { deferredPrompt } from '$lib/stores/deferredPrompt'
import NetworkStatus from '@hnn/components/network-status/NetworkStatus.svelte'
import { removeSplashScreen } from '$lib/stores/popups'

const ignoredPaths = ['edit', 'lovers', 'post', 'speculations']

function registerServiceWorker() {
  if ($page.url.host.includes('t:')) return

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
  }
}

let GA: any
let GATimeout: ReturnType<typeof setTimeout>
function initializeGA() {
  GATimeout = setTimeout(async () => {
    try {
      GA = (await import('@hnn/components/analytics/GA.svelte')).default
    } catch (_) {
      Log('warn', 'Could not load GA')
    }
  }, 6000)
}

function listenForUnhandledRejections() {
  window.addEventListener('unhandledrejection', (e) => {
    // Handle app-crash level errors here
    Log('error', 'Unhandled exception', {
      from: 'listenForUnhandledRejections',
      e,
    })
  })
}

onMount(() => {
  $navigateBack = null
  listenForUnhandledRejections()
  initializeAuthClient()
  registerServiceWorker()
  initializeGA()
  removeSplashScreen()
})

onDestroy(() => clearTimeout(GATimeout))

beforeNavigate(({ from, to, type }) => {
  if (type === 'popstate') return

  if (to?.url.pathname) {
    $navigationHistory.push(to.url.pathname)
  }
  if (
    ignoredPaths.some((path) => from?.url.pathname.includes(path)) ||
    ignoredPaths.some((path) => to?.url.pathname.includes(path))
  )
    return
  $navigateBack = from?.url.pathname ?? null
})
</script>

<svelte:window
  on:appinstalled={() => {
    registerEvent('pwa_installed', {
      canister_id: $authState.userCanisterId,
      userId: $userProfile.principal_id,
    })
  }}
  on:beforeinstallprompt={(e) => {
    deferredPrompt.set(e)
  }} />

<NetworkStatus />

{#if $authState.showLogin}
  <LoginPopup />
{/if}

<div class="safe-bottom relative h-full w-full overflow-hidden overflow-y-auto">
  <slot />
</div>

{#if GA}
  <svelte:component this={GA} tagId="G-S9P26021F9" pageUrl={$page?.url?.href} />
{/if}
