import { adjectives, verbs } from './verbs-adjectives'
import { getCurrentBrowserFingerPrint } from '@rajesh896/broprint.js'

export function generateRandomNumber(length: number, seed: number): string {
  let r = Math.sin(seed) * 10
  r = r - Math.floor(r)
  return Math.floor(r * Math.pow(10, length))
    .toString()
    .padEnd(length, '0')
}

export function generateRandomName(type: 'name' | 'username', seed?: string) {
  const string = seed || 'random'
  const sum = string.split('').reduce((acc, val) => val.charCodeAt(0) + acc, 0)

  const r1 = verbs[sum % verbs.length]
  const r2 = adjectives[sum % adjectives.length]

  if (type === 'name') {
    return `${r1} ${r2}`
  } else {
    return `${r1.toLowerCase()}-${r2.toLowerCase()}-${generateRandomNumber(
      4,
      sum,
    )}`
  }
}

export async function generateUniqueId() {
  return await getCurrentBrowserFingerPrint()
}
