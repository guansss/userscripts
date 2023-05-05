import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: "SD web UI Batch",
  match: "*://sdweb.gzpolpo.net/",
  noframes: true,
} satisfies ScriptMeta
