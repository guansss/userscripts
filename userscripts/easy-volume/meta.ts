import { UserscriptMeta } from "webpack-monkey"
import rootMeta from "../meta"

export default {
  ...rootMeta,
  version: "0.1",
  name: "Easy volume",
  match: "*://*/*",
} satisfies UserscriptMeta
