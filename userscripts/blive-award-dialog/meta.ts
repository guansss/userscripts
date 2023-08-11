import { UserscriptMeta } from "webpack-monkey"

export default {
  version: "0.1",
  name: "Bilibili live - remove award dialog",
  match: "*://live.bilibili.com/*",
  noframes: true,
} satisfies UserscriptMeta
