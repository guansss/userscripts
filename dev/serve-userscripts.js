const path = require("path")
const ts = require("typescript")
const { createFilter } = require("@rollup/pluginutils")
const { getAllUserscripts, urlMatch, cleanUrl } = require("./utils")
const { getLocaleFiles } = require("./i18n")
const { transformChunk } = require("./transform-output")

const namespace = "/@userscripts"

// vite plugin
module.exports = function serveUserscripts() {
  let config
  let isBuild = false

  const tsConfig = require(path.resolve(__dirname, "../tsconfig.json"))

  const filter = createFilter(/\.([tj]sx?)$/)

  return {
    name: "serve-userscripts",
    configResolved(resolvedConfig) {
      config = resolvedConfig
      isBuild = config.command !== "serve"
    },
    configureServer(server) {
      server.middlewares.use(namespace + "/all", (req, res) => send(res, getAllUserscripts()))
      server.middlewares.use(namespace + "/match", getMatchedScripts)
    },
    transform(code, moduleID) {
      if (!filter(moduleID) && !filter(cleanUrl(moduleID))) {
        return
      }

      if (code.includes("__LOCALES__")) {
        for (const localeFile of getLocaleFiles(moduleID)) {
          this.addWatchFile(localeFile)
        }
      }

      if (isBuild) {
        // preserve blank lines: https://github.com/microsoft/TypeScript/issues/843#issuecomment-625530359
        code = code.replace(/\n *?\r?\n/g, "\n/** THIS_IS_A_NEWLINE **/\n")

        const result = ts.transpileModule(code, { compilerOptions: tsConfig.compilerOptions })

        if (result.diagnostics && result.diagnostics.length) {
          printDiagnostics(result.diagnostics)
          throw new Error("Exiting due to TS diagnostics.")
        }

        code = result.outputText.replace(/^\s*?\/\*\* THIS_IS_A_NEWLINE \*\*\//gm, "")

        return { code }
      }
    },
    handleHotUpdate({ server, modules }) {
      // recursively add the module and its importers as affected
      const affectedModules = new Set()

      function addAffected(modules) {
        if (modules) {
          modules.forEach((module) => {
            if (!affectedModules.has(module)) {
              affectedModules.add(module)
              addAffected(module.importers)
            }
          })
        }
      }

      addAffected(modules)

      affectedModules.forEach((module) => {
        if (module.id) {
          server.ws.send({
            type: "custom",
            // event listeners are defined in vite.config.js
            event: "hmr:" + module.id,
            data: {},
          })
        }
      })
    },
    renderChunk(code, chunk, opts) {
      // disable esbuild since we've already compiled the code in transform()
      opts.__vite_skip_esbuild__ = true
    },
    async generateBundle(options, bundle) {
      await Promise.all(
        Object.values(bundle).map(async (info) => {
          if (info.type === "chunk") {
            await transformChunk({
              config,
              chunk: info,
            })
          }
        })
      )
    },
  }
}

function getMatchedScripts(req, res) {
  const query = new URLSearchParams(req.originalUrl.slice(req.originalUrl.indexOf("?")))
  const scripts = matchScriptsByURL(req.headers.referer, query.get("forceLoad"))

  send(res, scripts)
}

function matchScriptsByURL(url, forceLoad) {
  const userscripts = getAllUserscripts()

  forceLoad = forceLoad ? forceLoad.split(",") : []

  return userscripts.filter(({ name, dir }) => {
    if (forceLoad.includes(name)) {
      return true
    }

    try {
      const meta = require(dir + "/meta.json")

      // check fields: match, include, exclude,
      // each of which can be: undefined, string, array of string

      const include = [meta.include, meta.match].filter(Boolean).flat(Infinity)

      if (!include.some((pattern) => urlMatch(pattern, url))) {
        return false
      }

      const exclude = [meta.exclude].filter(Boolean).flat(Infinity)

      if (exclude.some((pattern) => urlMatch(pattern, url))) {
        return false
      }

      return true
    } catch (e) {
      console.error(`Error matching URL for ${name}:`, e)
    }
  })
}

function send(res, json) {
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.end(JSON.stringify(json))
}

function printDiagnostics(diagnostics) {
  diagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start)
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
    }
  })
}
