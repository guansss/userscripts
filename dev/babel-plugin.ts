import { PluginObj, types as t } from "@babel/core"
import { parse } from "@babel/parser"

interface Options {
  isDev: boolean
}

const DEV_ONLY_FUNCs = ["DEV_ONLY", "WITH_DEV_ONLY"]
const ON_RELOAD_FUNC = "ON_RELOAD"

export function BabelPlugin({ isDev }: Options) {
  return ({ template }: typeof import("@babel/core")): PluginObj => ({
    ...(!isDev && {
      // untyped option, see: https://babeljs.io/docs/babel-parser#will-the-babel-parser-support-a-plugin-system
      parserOverride: ((code, opts) => {
        // Babel doesn't preserve empty lines: https://github.com/babel/babel/issues/15064
        // we'll replace them with a placeholder and restore them later in the custom TerserPlugin
        code = code.replace(/\n *?\r?\n/g, "\n/*EMPTY_LINE*/\n")

        return parse(code, opts)
      }) satisfies typeof parse,
    }),

    visitor: {
      CallExpression(path, state) {
        const {
          node: { callee },
        } = path

        if (t.isIdentifier(callee)) {
          if (ON_RELOAD_FUNC === callee.name) {
            if (isDev) {
              path
                .get("callee")
                .replaceWith(template.expression.ast`import.meta.webpackHot.dispose`)
            } else {
              path.remove()
            }
          } else if (DEV_ONLY_FUNCs.includes(callee.name)) {
            if (!isDev) {
              path.remove()
            }
          }
        }
      },
    },
  })
}
