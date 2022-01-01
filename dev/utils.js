const { promisify } = require('util');
const glob = promisify(require('glob'));
const path = require('path');
const { matchPattern } = require('browser-extension-url-match');

async function getAllUserscripts() {
    const dirs = await glob(path.resolve(__dirname, '../userscripts') + '/*/');

    return dirs.map(dir => {
        const name = path.basename(dir);

        return {
            dir,
            name,
            entry: dir + 'index.ts',
            url: `userscripts/${name}/index.ts`
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
    getAllUserscripts,
    urlMatch
};
