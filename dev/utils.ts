import { matchPattern } from "browser-extension-url-match"
import { access } from "fs/promises"
import glob from "glob"
import { isArray, isBoolean, isNil, isString } from "lodash"
import path from "path"
import { includes } from "../userscripts/@common/array"
import { META_FIELDS, META_FIELDS_WITH_LOCALIZATION, ScriptMeta } from "../userscripts/@common/meta"
import { getGMAPIs, UserscriptInfo } from "./utils-shared"

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

export async function loadMeta(dir: string, file?: string): Promise<ScriptMeta> {
  if (file) {
    if (/\.[tj]s$/.test(file) || /\.json$/.test(file)) {
      return loadAsModule(file)
    }
    throw new TypeError("Unsupported meta file: " + file)
  }

  return Promise.resolve()
    .then(() => loadAsModule("meta.ts"))
    .catch(() => loadAsModule("meta.js"))
    .catch(() => loadAsModule("meta.json"))

  function loadAsModule(file: string) {
    const absPath = path.resolve(dir, file)

    return access(absPath).then(() => {
      const content = require(absPath)

      if ("default" in content && Object.keys(content).length === 1) {
        return content.default as ScriptMeta
      }

      return content as ScriptMeta
    })
  }
}

export function generateMetaBlock(
  source: string,
  meta: ScriptMeta,
  { requires }: { requires: string[] }
) {
  let metaBlock = "// ==UserScript==\n"
  const fieldPrefix = "// @"

  const metaFields = Object.keys(meta)
  const maxFieldLength = Math.max(
    ...["grant", "require", ...metaFields].map((field) => field.length)
  )
  const indentSize = fieldPrefix.length + maxFieldLength + 2
  const indentEnd = (str: string) => str.padEnd(indentSize, " ")

  function putField(field: string, value: string | string[] | boolean) {
    let line = fieldPrefix + field

    if (isString(value)) {
      line = indentEnd(line) + value
    } else if (isArray(value)) {
      line = value.map((v) => indentEnd(line) + v).join("\n")
    } else if (isBoolean(value)) {
      // ignore false value
      if (!value) {
        return
      }
    } else {
      console.warn("Unknown type of value:", value)
    }

    metaBlock += line + "\n"
  }

  for (const field of META_FIELDS) {
    if (includes(META_FIELDS_WITH_LOCALIZATION, field)) {
      const value = meta[field]

      if (isString(value)) {
        putField(field, value)
      } else {
        for (const lang in value) {
          putField(field + (lang === "default" ? "" : ":" + lang), value[lang])
        }
      }
    } else if (field === "grant") {
      // for grant, we simply check if the GM_* exists in the source code
      for (const api of getGMAPIs()) {
        if (source.includes(api)) {
          putField("grant", api)
        }
      }
    } else if (field === "require") {
      putField("require", requires)
    } else {
      if (!isNil(meta[field])) {
        putField(field, meta[field]!)
      }
    }
  }

  metaBlock += "// ==/UserScript=="

  return metaBlock
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
