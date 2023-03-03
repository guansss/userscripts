import { isNil } from "lodash"

export function getGMAPIs() {
  return [
    "unsafeWindow",
    "GM_addStyle",
    "GM_addElement",
    "GM_deleteValue",
    "GM_listValues",
    "GM_addValueChangeListener",
    "GM_removeValueChangeListener",
    "GM_setValue",
    "GM_getValue",
    "GM_log",
    "GM_getResourceText",
    "GM_getResourceURL",
    "GM_registerMenuCommand",
    "GM_unregisterMenuCommand",
    "GM_openInTab",
    "GM_xmlhttpRequest",
    "GM_download",
    "GM_getTab",
    "GM_saveTab",
    "GM_getTabs",
    "GM_notification",
    "GM_setClipboard",
    "GM_info",
  ]
}

export interface UserscriptInfo {
  dir: string
  name: string
  entry: string
  url: string
}

export async function filterAsync<T>(
  arr: T[],
  callback: (item: T) => Promise<boolean>
): Promise<T[]> {
  const filtered: T[] = []

  await Promise.all(
    arr.map(async (item) => {
      if (await callback(item)) {
        filtered.push(item)
      }
    })
  )

  return filtered
}

export function parentUntil<T>(
  target: T | null | undefined,
  getParent: (target: T) => T | null | undefined,
  callback: (target: T) => void | boolean
): T | null | undefined {
  const visited = new Set<T>()

  let current = target
  let result = null

  while (!isNil(current) && !visited.has(current)) {
    visited.add(current)

    if (callback(current)) {
      result = current
      return result
    }

    current = getParent(current)
  }

  return result
}

const patchedFlag = "__patched__"

export function markAsPatched(obj: any) {
  obj[patchedFlag] = true
}

export function isPatched(obj: any) {
  return patchedFlag in obj
}
