<script lang="ts">
import Icon from '@hnn/components/icon/Icon.svelte'
import LoginButton from '$lib/components/auth/LoginButton.svelte'
import TransactionItem from '$lib/components/wallet/TransactionItem.svelte'
import {
  fetchHistory,
  fetchTokenBalance,
  type TransactionHistory,
} from '$lib/helpers/profile'
import { authState, loadingAuthStatus } from '$lib/stores/auth'
import { userProfile } from '$lib/stores/app'
import { onMount } from 'svelte'
import { showMigrationPopup } from '$lib/stores/popups'

let loadBalanced = true
let loadList = true

let errorBalance = false
let errorList = false

let endOfList = false
let tokenBalance = 0
let history: TransactionHistory[] = []

$: loggedIn = $authState.isLoggedIn && !$loadingAuthStatus

async function refreshTokenBalance() {
  loadBalanced = true
  const res = await fetchTokenBalance()
  if (res.error) {
    errorBalance = true
  } else {
    tokenBalance = res.balance
  }
  loadBalanced = false
}

async function loadHistory() {
  if (endOfList) {
    return
  }

  loadList = true
  errorList = false
  const res = await fetchHistory(history.length)

  if (res.error) {
    errorList = true
    loadList = false
    return
  }

  history.push(...res.history)
  history = history

  endOfList = res.endOfList
  loadList = false
}

function init() {
  refreshTokenBalance()
  loadHistory()
}

$: loggedIn && init()

onMount(() => ($showMigrationPopup = true))
</script>

<svelte:head>
  <title>Wallet | Hot or Not</title>
</svelte:head>

{#if !loggedIn}
  <div
    class="flex h-full w-full flex-col items-center justify-center space-y-2">
    <div class="text-center text-sm opacity-70">
      Please login to access your wallet
    </div>
    <LoginButton
      loading={$loadingAuthStatus}
      on:click={() => ($authState.showLogin = true)} />
  </div>
{:else}
  <div class="flex h-full w-full flex-col overflow-hidden overflow-y-auto">
    <div class="flex items-center justify-between p-6">
      <div class="flex grow flex-col space-y-1">
        <div class="text-sm">Welcome!</div>
        <div class="text-md font-bold">{$userProfile.display_name}</div>
      </div>
      <img
        class="h-12 w-12 rounded-full object-cover"
        alt={$userProfile.display_name}
        src={$userProfile.profile_picture_url} />
    </div>
    <div
      class="flex w-full flex-col items-center justify-center space-y-1 py-4">
      <div class="text-sm uppercase">Your coyns balance</div>
      {#if errorBalance}
        <div class="text-sm font-bold opacity-50">Error loading balance</div>
      {:else if loadBalanced}
        <div class="text-sm font-bold opacity-50">Loading</div>
      {:else}
        <div class="text-4xl font-bold">{tokenBalance.toLocaleString()}</div>
      {/if}
    </div>

    <div class="flex justify-between px-6 pb-1 pt-4">
      <div class="text-sm">Recent Transactions</div>
      <a href="/wallet/transactions" class="text-sm opacity-50">See all</a>
    </div>
    <div
      class="relative flex flex-col space-y-2 divide-y-2 divide-white/10 px-6 pb-16 pt-4">
      {#if errorList}
        <div class="text-sm font-bold opacity-50">
          Error fetching transactions
        </div>
      {:else if loadList}
        <div class="text-sm font-bold opacity-50">Loading</div>
      {:else}
        {#each history as item}
          <TransactionItem {item} />
        {:else}
          <div class="flex grow h-full w-full items-center justify-center">
            <Icon name="transactions-graphic" class="w-full max-w-sm px-10" />
          </div>
          <div class="opacity-70 pt-4 text-center">No transactions yet</div>
        {/each}
      {/if}
      {#if $authState.isMigrated}
        <div
          class="absolute inset-0 top-[5.5rem] flex w-full flex-col items-center justify-start !border-0 py-20 backdrop-blur-md">
          Your account has been transferred to yral. Go ahead and explore the
          app <a
            target="_blank"
            class="font-bold text-[#E2017B] underline"
            href="https://yral.com">
            yral.com
          </a>
        </div>
      {/if}
    </div>
  </div>
{/if}
