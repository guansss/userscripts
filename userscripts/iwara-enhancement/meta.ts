import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.11",
  name: {
    default: "Iwara Enhancement",
    "zh-CN": "Iwara增强",
  },
  updateURL:
    "https://sleazyfork.org/scripts/416003-iwara-enhancement/code/Iwara%20Enhancement.user.js",
  match: "*://staging.iwara.tv/*",
  runAt: "document-start",
  noframes: true,
} satisfies ScriptMeta
