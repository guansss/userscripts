// make TS happy
import "webpack-dev-server"

import MiniCssExtractPlugin from "mini-css-extract-plugin"
import path from "path"
import postcssPresetEnv from "postcss-preset-env"
import { DefinePlugin, EntryPlugin } from "webpack"
import { monkey } from "webpack-monkey"
import { BabelPlugin } from "./dev/babel-plugin"
import { USERSCRIPTS_ROOT, getAllUserscripts } from "./dev/utils"

export default (_env: unknown, { mode }: { mode: string }) => {
  const isDev = mode !== "production"

  return monkey({
    mode: mode === "production" ? "production" : "development",
    entry: {
      ...Object.fromEntries(getAllUserscripts().map((s) => [s.name, s.entry])),
    },
    plugins: [
      isDev &&
        new EntryPlugin(__dirname, path.resolve(__dirname, "dev/client-prelude.ts"), {
          // make it a global entry
          name: undefined,
        }),
      new MiniCssExtractPlugin(),
      new DefinePlugin({
        BUILD_TIME: Date.now(),
        DEV: isDev,

        SCRIPT_ID: isDev
          ? DefinePlugin.runtimeValue(({ module }) => {
              const dirname = path.relative(USERSCRIPTS_ROOT, module.resource).split(path.sep)[0]
              return JSON.stringify(dirname)
            })
          : '""',

        // disable warnings during dev
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_I18N_FULL_INSTALL__: true,
        __VUE_I18N_LEGACY_API__: true,
      }),
    ],
    devServer: {
      port: 9527,
    },
    externals: isDev
      ? undefined
      : {
          vue: "Vue",
          "vue-i18n": "VueI18n",
          jquery: "$",
          "toastify-js": "Toastify",
        },
    output: {
      path: path.resolve(__dirname, "dist"),
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },
    module: {
      rules: [
        {
          resourceQuery: /raw/,
          type: "asset/source",
        },
        {
          test: /\.([cm]?ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [["@babel/preset-env", {}], "@babel/preset-typescript"],
                plugins: [BabelPlugin({ isDev })],
                assumptions: {
                  // we don't write weird code and so it's safe to disable this
                  // to avoid ugly helper functions
                  setPublicClassFields: true,
                },
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: [
            isDev ? "style-loader" : MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                modules: {
                  auto: true,
                  localIdentName: "[name]__[local]--[hash:base64:4]",
                  exportLocalsConvention: "camelCaseOnly",
                },
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [postcssPresetEnv({ stage: 1 })],
                },
              },
            },
          ],
        },
      ],
    },
  })
}
