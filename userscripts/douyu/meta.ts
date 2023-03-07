import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: "Douyu Script",
  match: "*://www.douyu.com/*",
  noframes: true,
} satisfies ScriptMeta
