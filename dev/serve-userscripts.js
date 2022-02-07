// vite plugin

const { getAllUserscripts, urlMatch } = require('./utils');
const { getLocaleFiles } = require('./i18n');

const namespace = '/@userscripts';

module.exports = function serveUserscripts() {
    return {
        name: 'serve-userscripts',
        configureServer(server) {
            server.middlewares.use(namespace + '/all', (req, res) => send(res, getAllUserscripts()));
            server.middlewares.use(namespace + '/match', getMatchedScripts);
        },
        transform(code, moduleID) {
            if (code.includes('__LOCALES__')) {
                for (const localeFile of getLocaleFiles(moduleID)) {
                    this.addWatchFile(localeFile);
                }
            }
        },
        handleHotUpdate({ server, modules }) {
            // recursively add the module and its importers as affected
            const affectedModules = new Set();

            function addAffected(modules) {
                if (modules) {
                    modules.forEach((module) => {
                        if (!affectedModules.has(module)) {
                            affectedModules.add(module);
                            addAffected(module.importers);
                        }
                    });
                }
            }

            addAffected(modules);

            affectedModules.forEach((module) => {
                if (module.id) {
                    server.ws.send({
                        type: 'custom',
                        // event listeners are defined in vite.config.js
                        event: 'hmr:' + module.id,
                        data: {},
                    });
                }
            });
        },
    };
};

function getMatchedScripts(req, res) {
    const query = new URLSearchParams(req.originalUrl.slice(req.originalUrl.indexOf('?')));
    const scripts = matchScriptsByURL(req.headers.referer, query.get('forceLoad'));

    send(res, scripts);
}

function matchScriptsByURL(url, forceLoad) {
    const userscripts = getAllUserscripts();

    forceLoad = forceLoad ? forceLoad.split(',') : [];

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

function send(res, json) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(json));
}
