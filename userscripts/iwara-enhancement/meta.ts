import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "1.0",
  name: {
    default: "Iwara Enhancement",
    "zh-CN": "Iwara增强",
  },
  description: {
    default: "Please refer to the script's homepage for more information.",
    "zh-CN": "请参考脚本的主页以获取更多信息",
  },
  updateURL:
    "https://sleazyfork.org/scripts/416003-iwara-enhancement/code/Iwara%20Enhancement.user.js",
  match: "*://*.iwara.tv/*",
  runAt: "document-start",
  noframes: true,
} satisfies ScriptMeta
