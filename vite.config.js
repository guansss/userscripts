import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import serveUserscripts from './dev/serve-userscripts';
import { getAllUserscripts } from './dev/utils';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
    const userscripts = await getAllUserscripts();

    return {
        plugins: [serveUserscripts()],
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
        },
        build: {
            rollupOptions: {
                input: Object.fromEntries(userscripts.map(({ name, entry }) => [name, entry])),
            },
        },
    };
});
