import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import serveUserscripts from './dev/serve-userscripts';
import { getAllUserscripts, getGMAPIs } from './dev/utils';
import replace from '@rollup/plugin-replace';
import { getLocales } from './dev/i18n';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
    const userscripts = await getAllUserscripts();

    return {
        plugins: [
            serveUserscripts(),
            replace({
                // allow replacing occurrences followed by a dot, such as "GM_info.script",
                // however this won't work until the bug is fixed: https://github.com/rollup/plugins/issues/904
                // delimiters: ['\b', '\b'],

                // prepend "__GM." to GM APIs, see "dev/dev.user.js"
                ...(mode !== 'production' && Object.fromEntries(getGMAPIs().map((api) => [api, '__GM.' + api]))),

                __LOCALES__(moduleID) {
                    const locales = getLocales(moduleID);

                    return `JSON.parse(${JSON.stringify(JSON.stringify(locales))})`;
                },
            }),
        ],
        css: {
            postcss: {
                plugins: [autoprefixer(), nested()],
            },
        },
        server: {
            port: 3000,
        },
        define: {
            __BUILD_TIME__: Date.now(),

            ...(mode !== 'production' && {
                // see above, because the default delimiters in rollup replace plugin is ['\b', '\b(?!\.)']
                // and cannot be changed due to the bug, occurrences like `GM_info.script` will not be replaced,
                // that's why we have to put the replacement here
                GM_info: '__GM.GM_info',
            }),

            // disable stupid warnings during dev
            __VUE_I18N_FULL_INSTALL__: true,
            __VUE_I18N_LEGACY_API__: true,
        },
        build: {
            rollupOptions: {
                input: Object.fromEntries(userscripts.map(({ name, entry }) => [name, entry])),
            },
        },
    };
});
