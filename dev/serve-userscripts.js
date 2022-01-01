// vite plugin

import { getAllUserscripts, urlMatch } from './utils';

const namespace = '/@userscripts';

export default function serveUserscripts() {
    return {
        name: 'serve-userscripts',
        configureServer(server) {
            server.middlewares.use(namespace + '/available', getAvailableUserscripts);
        }
    };
}

async function getAvailableUserscripts(req, res) {
    const scripts = await findUserscripts(req.originalUrl);

    res.setHeader('Content-Type', 'application/json')
        .setHeader('Access-Control-Allow-Origin', '*')
        .end(JSON.stringify(scripts));
}

export async function findUserscripts(url) {
    const userscripts = await getAllUserscripts();

    return userscripts.filter(({ name, dir }) => {
        try {
            const meta = require(dir + '/meta.json');

            // check fields: match, include, exclude,
            // each of which can be: undefined, string, array of string

            const include = [meta.include, meta.match].filter(Boolean).flat(Infinity);

            if (!include.some(pattern => urlMatch(pattern, url))) {
                return false;
            }

            const exclude = [meta.exclude].filter(Boolean).flat(Infinity);

            if (exclude.some(pattern => urlMatch(pattern, url))) {
                return false;
            }

            return true;
        } catch (e) {
            console.error(`Error matching URL for ${name}:`, e);
        }
    });
}
