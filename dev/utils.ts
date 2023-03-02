import { matchPattern } from "browser-extension-url-match"
import glob from "glob"
import { isNil } from "lodash"
import path from "path"

const USERSCRIPTS_ROOT = path.resolve(__dirname, "../userscripts")

function getGMAPIs() {
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

export function getAllUserscripts(): UserscriptInfo[] {
  const dirs = glob.sync(USERSCRIPTS_ROOT + "/*/")

  return dirs
    .filter((dir) => !path.basename(dir).startsWith("@"))
    .map((dir) => {
      const name = path.basename(dir)

      return {
        dir,
        name,
        entry: dir + "index.ts",
        url: `userscripts/${name}/index.ts`,
      }
    })
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

function getUserscriptDir(filePath) {
  if (filePath.length <= USERSCRIPTS_ROOT.length) {
    throw new TypeError("Invalid path: " + filePath)
  }

  const slashIndex = filePath.indexOf("/", USERSCRIPTS_ROOT.length + 2)

  if (slashIndex === -1) {
    return filePath
  }

  return filePath.slice(0, slashIndex)
}

const queryRE = /\?.*$/s
const hashRE = /#.*$/s

// source code from vite
function cleanUrl(url) {
  return url.replace(hashRE, "").replace(queryRE, "")
}

export function urlMatch(pattern: string, url: string) {
  const matcher = matchPattern(pattern)

  if (!matcher.valid) {
    throw new TypeError("Invalid pattern: " + pattern)
  }

  return matcher.match(url)
}
