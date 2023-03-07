import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: "Pixiv Script (Private use)",
  match: "https://www.pixiv.net/*",
  noframes: true,
} satisfies ScriptMeta
