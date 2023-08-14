import { UserscriptMeta } from "webpack-monkey"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: "SD web UI",
  match: "*://127.0.0.1/*",
  noframes: true,
} satisfies UserscriptMeta
