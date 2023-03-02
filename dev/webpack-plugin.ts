import { Compiler, NormalModule, sources } from "webpack"

const { RawSource } = sources

export function WebpackPlugin(compiler: Compiler) {
  const isDev = compiler.options.mode !== "production"

  compiler.hooks.compilation.tap(WebpackPlugin.name, (compilation, { normalModuleFactory }) => {
    const logger = compilation.getLogger(WebpackPlugin.name)

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
