import type { ParamMatcher } from '@sveltejs/kit'
export const match: ParamMatcher = (param: string) => {
  if (!param.includes('@')) {
    return false
  }
  const idArr = param.split('@')
  if (idArr.length != 2 && isNaN(Number(idArr[1]))) {
    return false
  }

  return true
}
