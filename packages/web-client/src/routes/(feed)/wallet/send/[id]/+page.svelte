<script lang="ts">
import type { UserProfileDetailsForFrontend } from '$canisters/individual_user_template/individual_user_template.did'
import IconButton from '$components/button/IconButton.svelte'
import CaretLeftIcon from '$components/icons/CaretLeftIcon.svelte'
import LoadingIcon from '$components/icons/LoadingIcon.svelte'
import NoTransactionsIcon from '$components/icons/NoTransactionsIcon.svelte'
import Input from '$components/input/Input.svelte'
import HomeLayout from '$components/layout/HomeLayout.svelte'
import { individualUser, userIndex } from '$lib/helpers/backend'
import { fetchHistory } from '$lib/helpers/profile'
import getDefaultImageUrl from '$lib/utils/getDefaultImageUrl'
import { isPrincipal } from '$lib/utils/isPrincipal'
import { generateRandomName } from '$lib/utils/randomUsername'
import { Principal } from '@dfinity/principal'
import { onMount } from 'svelte'
import { debounce } from 'throttle-debounce'

let walletId = ''
let foundUser: UserProfileDetailsForFrontend | null = null
let loading = false
let selectedUserId: Principal | null = null
let recents: UserProfileDetailsForFrontend[] = []

async function populateRecentTransactions() {
  const transactions = await fetchHistory(history.length)
}

const findWallet = debounce(500, async () => {
  // if (!!walletId.trim()) return
  loading = true
  foundUser = selectedUserId = null
  let canisterId: Principal | undefined = undefined
  if (isPrincipal(walletId)) {
    canisterId
    await userIndex().get_user_canister_id_from_user_principal_id(
      Principal.from(walletId),
    )[0]
  } else {
    canisterId = await userIndex().get_user_canister_id_from_unique_user_name(
      walletId,
    )[0]
  }
  if (!canisterId) {
    loading = false
    return
  }

  foundUser = await individualUser(canisterId[0]).get_profile_details()

  loading = false
})

onMount(() => {
  populateRecentTransactions()
})
</script>

<svelte:head>
  <title>Hot or Not | Wallet | Send tokens</title>
</svelte:head>

<HomeLayout>
  <svelte:fragment slot="top">
    <div
      class="flex w-full items-center justify-center bg-black py-4 shadow-xl shadow-black/50">
      Send Tokens
      <div class="absolute top-4 left-4">
        <IconButton href="/wallet-staging">
          <CaretLeftIcon class="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  </svelte:fragment>
  <svelte:fragment slot="content">
    <div
      class="flex h-full w-full flex-col items-center space-y-4 overflow-hidden overflow-y-scroll px-8 pb-20 pt-16">
      <div class="w-full pt-6">
        <Input
          bind:value={walletId}
          on:blur={findWallet}
          type="text"
          placeholder="Enter user's ID or username to search user"
          class="w-full rounded-md bg-white/10 py-4" />
      </div>
      {#if loading}
        <div
          class="flex h-full w-full flex-col items-center justify-center space-y-4 px-16">
          <LoadingIcon class="h-5 w-5 animate-spin-slow" />
        </div>
      {:else if walletId && !foundUser}
        <div
          class="flex h-full w-full flex-col items-center justify-center space-y-4 px-16">
          No such user found
        </div>
      {:else if foundUser}
        <div class="flex w-full items-center justify-between py-8 text-white">
          <div class="flex items-center space-x-4">
            <img
              src={getDefaultImageUrl('1')}
              alt="avatar"
              class="h-12 w-12 rounded-full object-cover" />
            <div class="flex flex-col items-start">
              <span>{generateRandomName('name', '1')}</span>
              <span class="text-sm text-white/50">10 Aug</span>
            </div>
          </div>
          <div
            class="h-4 w-4 rounded-full border-[1px] border-white/50 bg-transparent" />
        </div>
      {:else}
        <div
          class="flex h-full w-full flex-col items-center justify-center space-y-4 px-16">
          <NoTransactionsIcon class="w-56" />
          <div class="text-md text-center">
            You have not made any transactions yet
          </div>
        </div>
      {/if}
      <div
        class="flex h-full w-full flex-col items-center justify-center space-y-4 px-16">
        <div>Recents</div>
        {#each recents as recent}
          <div class="flex items-center space-x-4">
            <img
              src={recent.profile_picture_url[0]}
              alt="avatar"
              class="h-12 w-12 rounded-full object-cover" />
            <div class="flex flex-col items-start">
              <span>{recent.display_name}</span>
              <span class="text-sm text-white/50">10 Aug</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </svelte:fragment>
</HomeLayout>
