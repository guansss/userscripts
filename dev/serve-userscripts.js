// vite plugin

import { getAllUserscripts, urlMatch } from './utils';
import { getLocaleFiles } from './i18n';

const namespace = '/@userscripts';

export default function serveUserscripts() {
    return {
        name: 'serve-userscripts',
        configureServer(server) {
            server.middlewares.use(namespace + '/available', getAvailableUserscripts);
        },
        transform(code, moduleID) {
            if (code.includes('__LOCALES__')) {
                for (const localeFile of getLocaleFiles(moduleID)) {
                    this.addWatchFile(localeFile);
                }
            }
        },
    };
}

async function getAvailableUserscripts(req, res) {
    const query = new URLSearchParams(req.originalUrl.slice(req.originalUrl.indexOf('?')));
    const forceLoad = query.get('forceLoad') && query.get('forceLoad').split(',');
    const scripts = await findUserscripts(req.originalUrl, forceLoad);

    res.setHeader('Content-Type', 'application/json')
        .setHeader('Access-Control-Allow-Origin', '*')
        .end(JSON.stringify(scripts));
}

export async function findUserscripts(url, forceLoad = []) {
    const userscripts = await getAllUserscripts();

    return userscripts.filter(({ name, dir }) => {
        if (forceLoad.includes(name)) {
            return true;
        }

        try {
            const meta = require(dir + '/meta.json');

            // check fields: match, include, exclude,
            // each of which can be: undefined, string, array of string

            const include = [meta.include, meta.match].filter(Boolean).flat(Infinity);

            if (!include.some((pattern) => urlMatch(pattern, url))) {
                return false;
            }

            const exclude = [meta.exclude].filter(Boolean).flat(Infinity);

            if (exclude.some((pattern) => urlMatch(pattern, url))) {
                return false;
            }

            return true;
        } catch (e) {
            console.error(`Error matching URL for ${name}:`, e);
        }
    });
}
