<script lang="ts">
import Button from '@hnn/components/button/Button.svelte'
import Icon from '@hnn/components/icon/Icon.svelte'
import { fade } from 'svelte/transition'
import { showOnboardingPopup } from '$lib/stores/popups'
import left from '$lib/assets/decore-left.png'
import right from '$lib/assets/decore-right.png'
import UpDownVote from '$lib/components/vote/UpDownVote.svelte'
import { upDownPost } from '$lib/utils/constants'

let step: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1
</script>

<onboarding
  class="fade-in absolute inset-0 z-[15] flex h-full w-full items-center justify-center bg-black/90 px-8 text-white"
  out:fade={{ duration: 500 }}>
  {#if step == 1}
    <div
      class="flex h-full w-full max-w-md flex-col items-center justify-center space-y-32">
      <div
        class="pointer-events-none absolute top-0 flex w-full justify-between">
        <img alt="decore" src={left} class="select-none" />
        <img alt="decore" src={right} class="select-none" />
      </div>
      <div class="relative w-full select-none text-center text-3xl font-bold">
        <div
          class="absolute inset-0 bottom-16 flex items-center justify-center">
          <Icon name="stars-graphics" class="h-36" />
        </div>
        A new experience
        <br />
        awaits you
      </div>
      <div class="flex w-full flex-col space-y-6">
        <Button on:click={() => (step = 2)}>Start Tutorial</Button>
        <button
          on:click={() => ($showOnboardingPopup = false)}
          class="font-medium">
          Maybe Later
        </button>
      </div>
    </div>
  {:else if step == 2}
    <div
      class="relative flex h-full w-full max-w-md flex-col items-center justify-center space-y-8">
      <div
        class="flex w-full flex-col items-center justify-center space-y-6 text-center">
        <div class="text-3xl font-bold">Current Score Overview</div>
        <div>
          Check the current video score, influenced by likes, dislikes, views,
          and engagement. Predict if it'll rise or fall in the next hour.
        </div>
      </div>
      <div class="absolute bottom-20 z-[10] -translate-x-full">
        <Icon name="arrow-long-down" class="h-48 w-8" />
      </div>
      <Button class="px-12" on:click={() => (step = 3)}>Next</Button>
      <button
        on:click={() => ($showOnboardingPopup = false)}
        class="font-medium">
        Skip
      </button>

      <div class="pointer-events-none absolute inset-x-0 bottom-4 z-[5]">
        <UpDownVote post={upDownPost} tutorialStep={2} />
      </div>
    </div>
  {:else if step == 3}
    <div
      class="flex h-full w-full max-w-md flex-col items-center justify-center space-y-8">
      <div
        class="flex w-full flex-col items-center justify-center space-y-6 text-center">
        <div class="text-3xl font-bold">Select Your Voting Amount</div>
        <div>Choose your voting amount: 10, 50, or 100 tokens.</div>
      </div>
      <div class="absolute bottom-36 z-[10] -translate-x-full">
        <Icon name="arrow-long-down" class="h-48 w-8" />
      </div>
      <Button class="px-12" on:click={() => (step = 4)}>Next</Button>
      <button
        on:click={() => ($showOnboardingPopup = false)}
        class="font-medium">
        Skip
      </button>

      <div class="pointer-events-none absolute inset-x-0 bottom-4 z-[5]">
        <UpDownVote tutorialStep={3} post={upDownPost} />
      </div>
    </div>
  {:else if step == 4}
    <div
      class="relative flex h-full w-full max-w-md flex-col items-center justify-center space-y-8">
      <div
        class="flex w-full flex-col items-center justify-center space-y-6 text-center">
        <div class="text-3xl font-bold">Cast your Vote</div>
        <div>
          Click either 'UP' or 'DOWN' to predict whether the video's score will
          increase or decrease by the end of the hour.
        </div>
      </div>
      <div class="absolute bottom-24 left-10 z-[10]">
        <Icon name="arrow-long-down" class="h-52 w-8" />
      </div>
      <div
        style="transform: scaleX(-1)"
        class="absolute bottom-24 right-10 z-[10]">
        <Icon name="arrow-long-down" class="h-56 w-8" />
      </div>
      <Button class="px-12" on:click={() => (step = 5)}>Next</Button>
      <button
        on:click={() => ($showOnboardingPopup = false)}
        class="font-medium">
        Skip
      </button>

      <div class="pointer-events-none absolute inset-x-0 bottom-4 z-[5]">
        <UpDownVote tutorialStep={4} post={upDownPost} />
      </div>
    </div>
  {:else if step == 5}
    <div
      class="flex h-full w-full max-w-md flex-col items-center justify-center space-y-8">
      <div
        class="flex w-full flex-col items-center justify-center space-y-6 text-center">
        <div class="text-3xl font-bold">Remaining Time</div>
        <div>
          Keep an eye on the timer to see how much time is left until the
          results are revealed.
        </div>
      </div>

      <div
        style="transform: scaleX(-1)"
        class="absolute bottom-60 right-0 z-[10]">
        <Icon name="arrow-long-down" class="h-56 w-8" />
      </div>
      <Button class="px-12" on:click={() => (step = 6)}>Next</Button>
      <button
        on:click={() => ($showOnboardingPopup = false)}
        class="font-medium">
        Skip
      </button>

      <div class="absolute bottom-44 right-2 flex flex-col items-center gap-1">
        <Icon name="stopwatch" class="h-7 w-7" />
        <span class="text-fg-1 text-xs shadow-lg">47:32</span>
      </div>

      <div class="pointer-events-none absolute inset-x-0 bottom-4 z-[5]">
        <UpDownVote tutorialStep={5} post={upDownPost} />
      </div>
    </div>
  {:else if step == 6}
    <div
      class="relative flex h-full w-full max-w-md flex-col items-center justify-center space-y-8">
      <div
        class="flex w-full flex-col items-center justify-center space-y-6 text-center">
        <div class="text-3xl font-bold">Win 2X Tokens</div>
        <div>Vote in the right direction and win double the tokens!</div>
      </div>

      <Button class="px-12" on:click={() => (step = 7)}>Next</Button>
      <button
        on:click={() => ($showOnboardingPopup = false)}
        class="font-medium">
        Skip
      </button>
    </div>
  {:else if step == 7}
    <div
      class="relative flex h-full w-full max-w-md flex-col items-center justify-center space-y-8">
      <div
        class="flex w-full flex-col items-center justify-center space-y-6 text-center">
        <div class="text-3xl font-bold">Token Disclaimer</div>
        <div>
          You'll receive 1000 Tokens to kickstart your experience in the game.
          These tokens are for testing purposes and have no value in the main
          HotOrNot app. However, they will be considered for HOT token airdrops,
          COYN airdrops, and other NFT rewards as a thank you for supporting us
          and helping us try out the app.
        </div>
      </div>

      <button on:click={() => (step = 1)} class="text-xl font-bold">
        See the tutorial again
      </button>
      <Button class="px-12" on:click={() => ($showOnboardingPopup = false)}>
        Play to Earn
      </Button>
    </div>
  {/if}
</onboarding>
