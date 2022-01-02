const { promisify } = require('util');
const glob = promisify(require('glob'));
const JSON5 = require('json5');
const path = require('path');
const fs = require('fs');

function getLocales(userscriptDir) {
    const locales = {};

    for (const localeFile of glob.sync(userscriptDir + '/i18n/*.json5')) {
        const filename = path.basename(localeFile);
        const localeName = filename.slice(0, filename.indexOf('.'));
        const content = fs.readFileSync(localeFile, 'utf8');

        locales[localeName] = JSON5.parse(content);
    }

    return locales;
}

module.exports = {
    getLocales,
};
