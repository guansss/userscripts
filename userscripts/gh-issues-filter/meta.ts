import { ScriptMeta } from "../@common/meta"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: {
    default: "GitHub Default Issues Filter",
    "zh-CN": "GitHub Issues 默认过滤器",
  },
  description: {
    default: "Replaces GitHub issue's default filter",
    "zh-CN": "替换 GitHub issues 的默认过滤器",
  },
  match: "*://github.com/*",
  runAt: "document-start",
  noframes: true,
} satisfies ScriptMeta
