export const ssr = false

import { redirect } from '@sveltejs/kit'
export const load = async () => {
  throw redirect(307, '/up-down/')
}