<script lang="ts">
import type { inputAutocomplete } from './autocompleteTypes'
import { onMount } from 'svelte'

export let autocomplete: inputAutocomplete = 'off'
export let disabled = false
export let placeholder = ''
export let required = false
export let value: string | number = ''
export let maxlength: number | undefined = undefined
export let type: 'text' | 'password' | 'number' | 'email' = 'text'
export { exportClass as class }

let exportClass: any = ''
let inputEl: HTMLInputElement

onMount(() => {
  inputEl.type = type
})
</script>

<input
  {autocomplete}
  {disabled}
  {placeholder}
  {required}
  bind:value
  bind:this={inputEl}
  {maxlength}
  on:input
  on:keydown
  on:change
  on:focus
  on:blur
  on:paste
  class="grow border-none px-4 py-3 focus:ring-transparent disabled:opacity-50 {exportClass}" />
