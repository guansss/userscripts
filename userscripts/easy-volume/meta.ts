import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: "Easy volume",
  match: "*://*/*",
} satisfies ScriptMeta
