// @ts-ignore
import { getRequiredVersionFromDescriptionFile } from "webpack/lib/sharing/utils"
// @ts-ignore
import ConcatenatedModule from "webpack/lib/optimize/ConcatenatedModule"

import { compact, isObject, isString } from "lodash"
import path from "path"
import { Chunk, Compilation, Compiler, ExternalModule, NormalModule, sources } from "webpack"
import { ScriptMeta } from "../userscripts/@common/meta"
import { MaybePromise } from "../userscripts/@common/types/utils"
import { generateMetaBlock, loadMeta } from "./utils"

const { RawSource, ConcatSource } = sources

type RequireResolver = (args: {
  name: string
  externalType: string
  version?: string
  packageVersion?: string
}) => MaybePromise<string | undefined>

type CdnProvider = "jsdelivr" | "unpkg"

type MetaResolver = (args: { entryName: string; entry: string }) => MaybePromise<ScriptMeta>

interface Options {
  require?:
    | CdnProvider
    | RequireResolver
    | ({
        lockVersions?: boolean
        provider?: CdnProvider
      } & Record<string, string>)
  meta?: {
    resolve?: string | MetaResolver
  }
}

const cdnProviders: Record<CdnProvider, string> = {
  jsdelivr: "https://cdn.jsdelivr.net/npm",
  unpkg: "https://unpkg.com",
}

function createRequireResolver({
  // don't confuse with the `require()` function
  require: requireOpt,
}: Options): RequireResolver {
  return (args) => {
    if (typeof requireOpt === "function") {
      return requireOpt(args)
    }

    const { name, version, packageVersion } = args

    if (isObject(requireOpt) && requireOpt[name]) {
      return requireOpt[name]
    }

    const lockVersions = isString(requireOpt) ? false : !!requireOpt?.lockVersions

    if (lockVersions && !packageVersion) {
      throw new Error(
        `"exactVersion" is enabled but the package version could not be found, probably because the package is not installed.`
      )
    }

    const cdnProvider = isString(requireOpt)
      ? requireOpt
      : (requireOpt?.provider as CdnProvider) ?? "unpkg"

    const baseUrl = cdnProviders[cdnProvider]

    if (!baseUrl) {
      throw new Error(`Unknown CDN provider: ${cdnProvider}`)
    }

    let versionDef = lockVersions ? packageVersion : version

    if (versionDef) {
      versionDef = `@${versionDef}`
    }

    return `${baseUrl}/${name}${versionDef}`
  }
}

function createMetaResolver({ meta: { resolve } = {} }: Options): MetaResolver {
  return async (args) => {
    const { entry } = args

    if (typeof resolve === "function") {
      return resolve(args)
    }

    // if the entry has no extension, we assume it's a directory
    const dir = path.extname(entry) ? path.dirname(entry) : entry

    return loadMeta(dir, resolve)
  }
}

export function WebpackPlugin(options: Options = {}) {
  const requireResolver = createRequireResolver(options)
  const metaResolver = createMetaResolver(options)

  return (compiler: Compiler) => {
    const isDev = compiler.options.mode !== "production"

    compiler.hooks.compilation.tap(WebpackPlugin.name, (compilation, { normalModuleFactory }) => {
      const logger = compilation.getLogger(WebpackPlugin.name)

      function findOneOrNoneJsFile(chunk: Chunk) {
        const jsFiles = Array.from(chunk.files).filter((file) => file.endsWith(".js"))

        if (jsFiles.length > 1) {
          throw new Error(`multiple js files in chunk ${chunk.name}:\n- ${jsFiles.join("\n- ")}`)
        }

        return jsFiles[0]
      }

      if (!isDev) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: WebpackPlugin.name,
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          async (assets) => {
            const projectPackageJson = require(path.resolve(__dirname, "../package.json"))

            await Promise.all(
              Array.from(compilation.entrypoints).map(async ([entryName, { chunks, origins }]) => {
                if (origins.length !== 1) {
                  throw new Error(
                    `An entrypoint must have only one entry file, but "${entryName}" has ${
                      origins.length
                    }: ${origins.map((o) => o.request)}`
                  )
                }

                const entryFile = origins[0]!.request

                const meta = await metaResolver({ entryName, entry: entryFile })

                await Promise.all(
                  // there's most likely only one chunk per entrypoint
                  chunks.map(async (chunk) => {
                    const jsFile = findOneOrNoneJsFile(chunk)

                    if (!jsFile) {
                      return
                    }

                    const jsSource = assets[jsFile]

                    if (!jsSource) {
                      logger.warn("js file not found:", jsFile)
                      return
                    }

                    const rawJsSource = jsSource.source().toString("utf-8")

                    // TODO: more reliable way to get all modules
                    const modules = compilation.chunkGraph
                      .getChunkModules(chunk)
                      .flatMap((mod) =>
                        mod instanceof ConcatenatedModule
                          ? (mod as ConcatenatedModule).modules
                          : mod
                      )

                    const externalModules = modules.filter(
                      (dep): dep is ExternalModule => dep instanceof ExternalModule
                    )

                    const requires = compact(
                      await Promise.all(
                        externalModules.map(async ({ userRequest: name, externalType }) => {
                          const version: string = getRequiredVersionFromDescriptionFile(
                            projectPackageJson,
                            name
                          )

                          let packageVersion: string | undefined

                          if (version) {
                            packageVersion = require(name).version
                          }

                          return requireResolver({
                            name,
                            externalType,
                            version,
                            packageVersion,
                          })
                        })
                      )
                    )

                    const newJsSource = new ConcatSource(
                      generateMetaBlock(
                        rawJsSource,
                        {
                          ...meta,
                          grant: compact([meta.grant, "GM_addStyle"].flat(2)),
                        },
                        { requires }
                      ),
                      "\n\n",
                      rawJsSource
                    )

                    compilation.updateAsset(jsFile, newJsSource)
                  })
                )
              })
            )
          }
        )

        compilation.hooks.processAssets.tap(
          {
            name: WebpackPlugin.name,
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
          },
          (assets) => {
            for (const chunk of compilation.chunks) {
              const jsFile = findOneOrNoneJsFile(chunk)
              const cssFiles = Array.from(chunk.files).filter((file) => file.endsWith(".css"))

              if (!jsFile || !cssFiles.length) {
                continue
              }

              const jsSource = assets[jsFile]

              if (!jsSource) {
                logger.warn("js file not found:", jsFile)
                continue
              }

              const concatenatedCss = new ConcatSource()

              for (const cssFile of cssFiles) {
                const cssAsset = assets[cssFile]

                if (cssAsset) {
                  logger.info("inlining CSS:", cssFile)

                  concatenatedCss.add(cssAsset)
                  compilation.deleteAsset(cssFile)
                } else {
                  logger.warn("css file not found:", cssFile)
                }
              }

              const newJsSource = new ConcatSource(
                jsSource,
                "\nGM_addStyle(`\n",
                concatenatedCss,
                "`)\n"
              )
              compilation.updateAsset(jsFile, newJsSource)
            }
          }
        )

        normalModuleFactory.hooks.generator
          .for("asset/source")
          .tap(WebpackPlugin.name, (generator /* AssetSourceGenerator */) => {
            const originalGenerate = generator.generate

            generator.generate = (module: NormalModule, ...rest: any[]) => {
              const rawSource = originalGenerate.call(generator, module, ...rest)

              try {
                if (module.rawRequest.split("?")[1]?.includes("literal")) {
                  if (!(rawSource instanceof RawSource)) {
                    throw new Error("source is not RawSource")
                  }

                  const content = rawSource.source()

                  if (typeof content !== "string") {
                    throw new Error("content is not string")
                  }

                  let matched = false

                  const newContent = content.replace(
                    /(const|var) ([^=]+? =) "(.+)";$/,
                    (_match, s1, s2, s3) => {
                      matched = true

                      s3 = s3.replace(/\\n/g, "\n")

                      return `${s1} ${s2} \`\n${s3}\`;`
                    }
                  )

                  if (!matched) {
                    throw new Error("content does not match the pattern")
                  }

                  return new RawSource(newContent)
                }
              } catch (e) {
                logger.warn("error while processing literal asset", e)
              }

              return rawSource
            }
          })
      }
    })
  }
}
