import { compact } from "lodash"
import { ExpressRequestHandler } from "webpack-dev-server"
import { getAllUserscripts, loadMeta, urlMatch } from "./utils"
import { filterAsync, UserscriptInfo } from "./utils-shared"

export const serveUserscripts: ExpressRequestHandler = async (req, res, next) => {
  if (req.path === "/@userscripts/all") {
    res.json(getAllUserscripts())
  } else if (req.path === "/@userscripts/match") {
    const referrer = req.header("Referer")
    const forceLoad = req.query["forceLoad"] as string | undefined

    if (!referrer) {
      res.status(400).json({ error: "Missing Referer header" })
      return
    }

    res.json(await matchScriptsByURL(referrer, forceLoad))
  } else {
    next()
  }
}

async function matchScriptsByURL(url: string, forceLoad?: string): Promise<UserscriptInfo[]> {
  return filterAsync(getAllUserscripts(), async ({ name, dir }) => {
    if (forceLoad?.includes(name)) {
      return true
    }

    try {
      const meta = await loadMeta(dir)

      // check fields: match, include, exclude,
      // each of which can be: undefined, string, array of string

      const include = compact([meta.include, meta.match]).flat()

      if (include.some((pattern) => urlMatch(pattern, url))) {
        const exclude = compact([meta.exclude]).flat()

        if (!exclude.some((pattern) => urlMatch(pattern, url))) {
          return true
        }
      }
    } catch (e) {
      console.error(`Error matching URL for ${name}:`, e)
    }

    return false
  })
}
