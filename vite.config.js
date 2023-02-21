const replace = require("@rollup/plugin-replace")
const autoprefixer = require("autoprefixer")
const fs = require("fs")
const nested = require("postcss-nested")
const { defineConfig, loadEnv } = require("vite")
const { getLocales } = require("./dev/i18n")
const serveUserscripts = require("./dev/serve-userscripts")
const { getGMAPIs } = require("./dev/utils")

// https://vitejs.dev/config/
module.exports = defineConfig(async ({ mode }) => {
  const isDev = mode === "development"
  const env = loadEnv(mode, "", "")

  if (isDev && (!env.SSL_KEY || !env.SSL_CERT)) {
    throw new Error("Environment variables SSL_KEY and SSL_CERT are required.")
  }

  const packageJSON = require("./package.json")
  const dependencies = Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies)

  function cdn(dep, file) {
    let version = dependencies[dep]

    if (!version) {
      throw new Error(`Could not find version of dependency: ${dep}`)
    }

    if (version.startsWith("^")) {
      version = version.slice(1).split(".")[0]
    } else if (version.startsWith("~")) {
      version = version.slice(1).split(".").slice(0, 2).join(".")
    }

    return {
      ["__" + dep]: `https://cdn.jsdelivr.net/npm/${dep}@${version}${file ? "/" + file : ""}`,
    }
  }

  return {
    // we'll be using tsc during build
    esbuild: isDev,

    plugins: [
      serveUserscripts(),
      replace({
        delimiters: ["", ""],
        preventAssignment: true,

        // prepend "__GM." to GM APIs, see "dev/dev.user.js"
        ...(isDev && Object.fromEntries(getGMAPIs().map((api) => [api, "__GM." + api]))),

        __LOCALES__(moduleID) {
          const locales = getLocales(moduleID)

          return `JSON.parse(${JSON.stringify(JSON.stringify(locales))})`
        },
        __MODULE_ID__(moduleID) {
          // do not inject module ID in production
          return JSON.stringify(isDev ? moduleID : "")
        },
        "__ON_RELOAD__("(moduleID) {
          // events are defined in dev/serve-userscripts.js
          return `import.meta.hot.on('hmr:${moduleID}', `
        },
      }),
    ],
    resolve: {
      alias: {
        // enable template compiler at runtime
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },
    css: {
      postcss: {
        plugins: [autoprefixer(), nested()],
      },
      modules: {
        localsConvention: "camelCaseOnly",
        generateScopedName: "[local]_[hash:3]",
      },
    },
    server: {
      port: 3000,
      https: {
        key: env.SSL_KEY ? fs.readFileSync(env.SSL_KEY) : undefined,
        cert: env.SSL_CERT ? fs.readFileSync(env.SSL_CERT) : undefined,
      },
      hmr: {
        // must be specified because we're running HMR on online sites
        host: "127.0.0.1",

        // both must be specified or else the Websocket will not connect
        protocol: "wss",
        port: 3000,
      },
    },
    define: {
      __BUILD_TIME__: Date.now(),

      __DEV__: isDev,

      // disable warnings during dev
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: true,
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        external: ["vue", "vue-i18n", "jquery"],
        output: {
          globals: {
            vue: "Vue",
            "vue-i18n": "VueI18n",
            jquery: "$",
            Toastify: "toastify-js",

            // a quick way to define CDN links near to the globals definitions...
            // will be consumed by dev/transform-output.js
            ...cdn("vue", "dist/vue.global.prod.js"),
            ...cdn("vue-i18n", "dist/vue-i18n.global.prod.js"),
            ...cdn("jquery", "dist/jquery.min.js"),
            ...cdn("toastify-js", ""),
          },
          format: "iife",
          entryFileNames: "assets/[name].user.js",
        },
      },
      minify: false,
      manifest: true,
    },
  }
})
