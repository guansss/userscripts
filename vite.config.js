const replace = require('@rollup/plugin-replace');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const nested = require('postcss-nested');
const { defineConfig, loadEnv } = require('vite');
const { getLocales } = require('./dev/i18n');
const serveUserscripts = require('./dev/serve-userscripts');
const { getGMAPIs } = require('./dev/utils');

// https://vitejs.dev/config/
module.exports = defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, '', '');

    if (!env.SSL_KEY || !env.SSL_CERT) {
        throw new Error('Please specify SSL_KEY and SSL_CERT in .env');
    }

    return {
        plugins: [
            serveUserscripts(),
            replace({
                delimiters: ['', ''],
                preventAssignment: true,

                // prepend "__GM." to GM APIs, see "dev/dev.user.js"
                ...(mode !== 'production' && Object.fromEntries(getGMAPIs().map((api) => [api, '__GM.' + api]))),

                __LOCALES__(moduleID) {
                    const locales = getLocales(moduleID);

                    return `JSON.parse(${JSON.stringify(JSON.stringify(locales))})`;
                },

                '__ON_RELOAD__('(moduleID) {
                    // events are defined in dev/serve-userscripts.js
                    return `import.meta.hot.on('hmr:${moduleID}', `;
                },
            }),
        ],
        resolve: {
            alias: {
                // enable template compiler at runtime
                vue: 'vue/dist/vue.esm-bundler.js',
            },
        },
        css: {
            postcss: {
                plugins: [autoprefixer(), nested()],
            },
            modules: {
                localsConvention: 'camelCaseOnly',
                generateScopedName: '[local]_[hash:3]',
            },
        },
        server: {
            port: 3000,
            https: {
                key: fs.readFileSync(env.SSL_KEY),
                cert: fs.readFileSync(env.SSL_CERT),
            },
            hmr: {
                // must be specified because we're running HMR on online sites
                host: '127.0.0.1',

                // both must be specified or else the Websocket will not connect
                protocol: 'wss',
                port: 3000,
            },
        },
        define: {
            __BUILD_TIME__: Date.now(),

            __DEV__: mode !== 'production',

            // disable warnings during dev
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            __VUE_I18N_FULL_INSTALL__: true,
            __VUE_I18N_LEGACY_API__: true,
        },
        build: {
            rollupOptions: {
                external: ['vue', 'vue-i18n', 'jquery'],
                output: {
                    globals: {
                        vue: 'Vue',
                        'vue-i18n': 'VueI18N',
                        jquery: '$',
                    },
                    format: 'iife',
                    entryFileNames: 'assets/[name].user.js',
                },
            },
            target: 'es2017',
            minify: false,
            manifest: true,
        },
    };
});
