import { matchPattern } from "browser-extension-url-match"
import glob from "glob"
import path from "path"
import { UserscriptInfo } from "./utils-shared"

export const USERSCRIPTS_ROOT = path.resolve(__dirname, "../userscripts")

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
