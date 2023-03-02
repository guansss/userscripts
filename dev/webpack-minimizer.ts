import { identity } from "lodash"
import prettier from "prettier"
import TerserPlugin from "terser-webpack-plugin"
import { Compiler } from "webpack"
import { parentUntil } from "./utils"

const prettierConfigAsync = prettier.resolveConfig(__dirname)

export class WebpackMinimizer extends TerserPlugin {
  logger = console

  constructor() {
    super({
      parallel: false,
      minify: async (file, ...rest) => {
        file = { ...file }

        for (const id in file) {
          file[id] = identity(file[id]!)
            // remove webpack's `CONCATENATED MODULE` comments,
            // as well as converting their type to `/* */` to prevent Terser
            // from moving them to the end of their previous lines
            .replace(/\/\/ CONCATENATED MODULE.*/g, "/*EMPTY_LINE*/")
            // remove webpack's /******/ comments
            .replace(/\/\*+\//g, "")
            // remove webpackBootstrap comments
            .replace(/\/\/ webpackBootstrap/g, "")
        }

        // run a dummy minify to allow the `comments` callback (see below)
        // to patch the internal methods before running the real minify
        await TerserPlugin.terserMinify({ "dummy.js": "// dummy" }, ...rest)

        const result = await TerserPlugin.terserMinify(file, ...rest)

        // restore empty lines from placeholders set by BabelPlugin
        result.code = result.code.replace(/\/\*EMPTY_LINE\*\//g, "\n\n")

        result.code = prettier.format(result.code, {
          ...(await prettierConfigAsync),
          parser: "babel",
        })

        return result
      },
      terserOptions: {
        compress: {
          defaults: false,
          dead_code: true,
          unused: true,
          side_effects: true,
          passes: 2,
        },
        mangle: false,
        format: {
          comments: (node, comment) => {
            this.patchOutputStream(node)

            return true
          },
        },
      },
    })
  }

  override apply(compiler: Compiler): void {
    super.apply(compiler)

    compiler.hooks.compilation.tap(WebpackMinimizer.name, (compilation) => {
      this.logger = compilation.getLogger(WebpackMinimizer.name) as any
    })
  }

  /**
   * This patch is based on the current version of source code. If it's not working,
   * check the latest source code and update the patch.
   * @see https://github.com/terser/terser/blob/6268e5fcbd0bad36603d5cd13d9b0da106c1a8dc/lib/output.js#L889-L912
   */
  patchOutputStream(node: any) {
    if (!isPatched(node)) {
      const AST_Node_prototype = parentUntil(
        node,
        (n) => Object.getPrototypeOf(n),
        (n) => n.TYPE === "Node"
      )

      if (AST_Node_prototype) {
        markAsPatched(AST_Node_prototype)

        const { print } = AST_Node_prototype

        const self = this

        AST_Node_prototype.print = function (this: unknown, output: any, ...rest: any[]) {
          if (!output || !("indent" in output)) {
            self.logger.warn("failed to patch: not getting an OutputStream instance.")
          } else if (!isPatched(output)) {
            markAsPatched(output)

            self.removeRedundantComments(output)
            self.preserveLineBreakInTemplateString(output)
          }

          return print.call(this, output, ...rest)
        }
      }
    }
  }

  removeRedundantComments(output: any) {
    if (!output.append_comments) {
      this.logger.warn(
        'could not get Terser to remove redundant comments, because "output.append_comments" is undefined.'
      )
      return
    }

    output.append_comments = () => {}
  }

  /**
   * Prevents Terser from replacing line breaks in template strings with `\n`.
   *
   * ```js
   * // input
   * const str = `line1
   * line2`
   *
   * // output before patch
   * const str = `line1\nline2`
   *
   * // output after patch, same as input
   * const str = `line1
   * line2`
   * ```
   *
   * This patch is based on the current version of source code. If it's not working,
   * check the latest source code and update the patch.
   * @see https://github.com/terser/terser/blob/6268e5fcbd0bad36603d5cd13d9b0da106c1a8dc/lib/output.js#L851-L854
   */
  preserveLineBreakInTemplateString(output: any) {
    const { print_template_string_chars } = output

    if (!print_template_string_chars) {
      this.logger.warn(
        'could not get Terser to preserve line breaks in template strings, because "output.print_template_string_chars" is undefined.'
      )
      return
    }

    const self = this

    output.print_template_string_chars = function (this: unknown, str: string, ...rest: any) {
      const fakeStr = new String(str)

      fakeStr.replace = function (this: String, searchValue, replacer) {
        try {
          if (searchValue instanceof RegExp) {
            // prevent the newline from being matched, so they won't be escaped
            if (searchValue.source.includes("\\n")) {
              searchValue = new RegExp(searchValue.source.replace("\\n", ""), searchValue.flags)
            }
          }
        } catch (e) {
          self.logger.warn("failed to preserve line breaks:", e)
        }

        return str.replace(searchValue as any, replacer as any)
      }

      try {
        return print_template_string_chars.call(this, fakeStr, ...rest)
      } catch (e) {
        self.logger.warn("failed to preserve line breaks:", e)

        return print_template_string_chars.call(this, str, ...rest)
      }
    }
  }
}

const patchedFlag = "__patched__"

function markAsPatched(obj: any) {
  obj[patchedFlag] = true
}

function isPatched(obj: any) {
  return patchedFlag in obj
}
