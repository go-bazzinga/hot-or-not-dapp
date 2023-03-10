import { openDB } from 'idb'
import Log from '../utils/Log'

type DBStores = 'canisters' | 'watch' | 'watch-hon'

const dbPromise = openDB('keyval-store', 3, {
  upgrade(db) {
    console.log('upgrade called', db, db.objectStoreNames)
    if (!db.objectStoreNames.contains('keyval')) {
      db.createObjectStore('keyval')
    }
    if (!db.objectStoreNames.contains('canisters')) {
      db.createObjectStore('canisters')
    }
    if (!db.objectStoreNames.contains('watch')) {
      db.createObjectStore('watch')
    }
    if (!db.objectStoreNames.contains('watch-hon')) {
      db.createObjectStore('watch-hon')
    }
  },
}).catch((e) => {
  Log({ error: e, from: 'idb' }, 'error')
})

export async function get(storeName: DBStores, key) {
  return (await dbPromise)?.get(storeName, key)
}
export async function set(storeName: DBStores, key, val) {
  return (await dbPromise)?.put(storeName, val, key)
}
export async function del(storeName: DBStores, key) {
  return (await dbPromise)?.delete(storeName, key)
}
export async function clear(storeName: DBStores) {
  return (await dbPromise)?.clear(storeName)
}
export async function keys(storeName: DBStores) {
  return (await dbPromise)?.getAllKeys(storeName)
}
export async function values(storeName: DBStores) {
  return (await dbPromise)?.getAll(storeName)
}