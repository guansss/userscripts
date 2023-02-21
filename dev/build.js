const { build, resolveConfig } = require("vite")
const { getAllUserscripts } = require("./utils")
const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

async function main() {
  const config = await resolveConfig({}, "build", "production")
  const assetsDir = path.resolve(__dirname, "..", config.build.outDir, "./assets")

  for (const script of getAllUserscripts()) {
    console.log("\nBuilding userscript:", script.name)

    await build({
      build: {
        emptyOutDir: false,
        rollupOptions: {
          input: {
            [script.name]: script.entry,
          },
        },
      },
    })

    const outFile = path.join(assetsDir, `${script.name}.user.js`)

    if (!fs.existsSync(outFile)) {
      throw new Error("Missing output file: " + outFile)
    }

    try {
      // check the syntax
      execSync(`node --check ${outFile}`)
    } catch (e) {
      console.log(e + "")
    }
  }
}

main()
