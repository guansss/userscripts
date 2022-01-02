const { promisify } = require('util');
const glob = promisify(require('glob'));
const path = require('path');
const { matchPattern } = require('browser-extension-url-match');

const USERSCRIPTS_ROOT = path.resolve(__dirname, '../userscripts');

function getGMAPIs() {
    return [
        'unsafeWindow',
        'GM_addStyle',
        'GM_addElement',
        'GM_deleteValue',
        'GM_listValues',
        'GM_addValueChangeListener',
        'GM_removeValueChangeListener',
        'GM_setValue',
        'GM_getValue',
        'GM_log',
        'GM_getResourceText',
        'GM_getResourceURL',
        'GM_registerMenuCommand',
        'GM_unregisterMenuCommand',
        'GM_openInTab',
        'GM_xmlhttpRequest',
        'GM_download',
        'GM_getTab',
        'GM_saveTab',
        'GM_getTabs',
        'GM_notification',
        'GM_setClipboard',
        'GM_info',
    ];
}

async function getAllUserscripts() {
    const dirs = await glob(USERSCRIPTS_ROOT + '/*/');

    return dirs.map((dir) => {
        const name = path.basename(dir);

        return {
            dir,
            name,
            entry: dir + 'index.ts',
            url: `userscripts/${name}/index.ts`,
        };
    });
}

function urlMatch(pattern, url) {
    const matcher = matchPattern(pattern);

    if (!matcher.valid) {
        throw new TypeError('Invalid pattern: ' + pattern);
    }

    return matcher.match(url);
}

module.exports = {
    USERSCRIPTS_ROOT,
    getAllUserscripts,
    urlMatch,
    getGMAPIs,
};
