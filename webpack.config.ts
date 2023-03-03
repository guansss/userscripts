// make TS happy
import "webpack-dev-server"

import MiniCssExtractPlugin from "mini-css-extract-plugin"
import path from "path"
import postcssPresetEnv from "postcss-preset-env"
import { Configuration, DefinePlugin } from "webpack"
import { BabelPlugin } from "./dev/babel-plugin"
import { serveUserscripts } from "./dev/middlewares"
import { getAllUserscripts, USERSCRIPTS_ROOT } from "./dev/utils"
import { WebpackMinimizer } from "./dev/webpack-minimizer"
import { WebpackPlugin } from "./dev/webpack-plugin"

export default (_env: unknown, { mode }: { mode: string }) => {
  const isDev = mode !== "production"

  return {
    mode: mode === "production" ? "production" : "development",
    entry: {
      ...Object.fromEntries(getAllUserscripts().map((s) => [s.name, s.entry])),
      ...(isDev && { "dev-impl": "./dev/client/dev-impl.user.ts" }),
    },
    plugins: [
      WebpackPlugin,
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
      // we don't want the page to reload, even if hot reloading fails
      hot: "only",

      headers: {
        "Access-Control-Allow-Origin": "*",
      },

      webSocketServer: "sockjs",
      client: {
        webSocketTransport: "sockjs",
        webSocketURL: "ws://127.0.0.1:9527/ws",
      },

      setupMiddlewares: (middlewares) => {
        middlewares.unshift(serveUserscripts)

        return middlewares
      },
    },
    externals: {
      vue: "Vue",
      "vue-i18n": "VueI18n",
      jquery: "$",
      "toastify-js": "Toastify",
    },
    externalsType: "var",
    output: {
      filename: "[name].user.js",
      path: path.resolve(__dirname, "dist"),
      // module: true,
    },
    experiments: {
      // outputModule: true,
    },
    optimization: {
      minimizer: [new WebpackMinimizer()],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
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
                presets: [
                  ["@babel/preset-env", { targets: "defaults" }],
                  "@babel/preset-typescript",
                ],
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
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                modules: {
                  exportLocalsConvention: "camelCaseOnly",
                },
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [postcssPresetEnv()],
                },
              },
            },
          ],
        },
      ],
    },
  } satisfies Configuration
}
