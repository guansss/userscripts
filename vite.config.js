import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        plugins: [],
        css: {
            postcss: {
                plugins: [autoprefixer(), nested()]
            }
        },
        server: {
            port: 8080
        },
        define: {
            __BUILD_TIME__: Date.now()
        }
    };
});
