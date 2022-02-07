const { merge } = require('lodash');
const { build } = require('vite');
const { getAllUserscripts } = require('./utils');
const config = require('../vite.config.js');

async function main() {
    for (const script of getAllUserscripts()) {
        console.log('\nBuilding userscript:', script.name);

        await build(
            merge({}, config, {
                build: {
                    emptyOutDir: false,
                    rollupOptions: {
                        input: {
                            [script.name]: script.entry,
                        },
                    },
                },
            })
        );
    }
}

main();
