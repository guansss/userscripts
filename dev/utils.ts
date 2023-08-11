import glob from "glob"
import path from "path"

export const USERSCRIPTS_ROOT = path.resolve(__dirname, "../userscripts")

export interface UserscriptInfo {
  dir: string
  name: string
  entry: string
  url: string
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
