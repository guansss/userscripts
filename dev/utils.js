const glob = require('glob');
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

function getAllUserscripts() {
    const dirs = glob.sync(USERSCRIPTS_ROOT + '/*/');

    return dirs
        .filter((dir) => !path.basename(dir).startsWith('@'))
        .map((dir) => {
            const name = path.basename(dir);

            return {
                dir,
                name,
                entry: dir + 'index.ts',
                url: `userscripts/${name}/index.ts`,
            };
        });
}

function getUserscriptDir(filePath) {
    if (filePath.length <= USERSCRIPTS_ROOT) {
        throw new TypeError('Invalid path: ' + filePath);
    }

    const slashIndex = filePath.indexOf('/', USERSCRIPTS_ROOT.length + 2);

    if (slashIndex === -1) {
        return filePath;
    }

    return filePath.slice(0, slashIndex);
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
    getUserscriptDir,
    urlMatch,
    getGMAPIs,
};
