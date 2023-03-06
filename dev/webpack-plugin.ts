import { Compilation, Compiler, NormalModule, sources } from "webpack"

const { RawSource, ConcatSource } = sources

export function WebpackPlugin(compiler: Compiler) {
  const isDev = compiler.options.mode !== "production"

  compiler.hooks.compilation.tap(WebpackPlugin.name, (compilation, { normalModuleFactory }) => {
    const logger = compilation.getLogger(WebpackPlugin.name)

    compilation.hooks.processAssets.tap(
      {
        name: WebpackPlugin.name,
        stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
      },
      (assets) => {
        for (const chunk of compilation.chunks) {
          const files = Array.from(chunk.files)
          const jsFiles = files.filter((file) => file.endsWith(".js"))
          const cssFiles = files.filter((file) => file.endsWith(".css"))

          if (!jsFiles.length || !cssFiles.length) {
            continue
          }

          if (jsFiles.length > 1) {
            logger.warn(`multiple js files in chunk ${chunk.name}:`, jsFiles)
            continue
          }

          const jsFile = jsFiles[0]!
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

    if (!isDev) {
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
