const { USERSCRIPTS_ROOT, getGMAPIs } = require('./utils');
const rootMeta = require(USERSCRIPTS_ROOT + '/meta.json');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist/assets');

const scriptGrants = getGMAPIs();

// sorted by preference
const metaFields = [
    'name:*',
    'description:*',
    'version',
    'author',
    'source',
    'supportURL',
    'updateURL',
    'match',
    'exclude',
    'run-at',
    'noframes',
];

function main() {
    console.log(' ');

    const jsFiles = glob.sync(distDir + '/*.js');

    for (const js of jsFiles) {
        const filename = path.basename(js);
        const name = filename.slice(0, filename.indexOf('.'));

        console.log('[Postbuild] Processing ' + filename);

        let content = fs.readFileSync(js, 'utf8');

        content = generateMetaBlock(name, content);
        content = extractCSS(name, content);

        fs.writeFileSync(js, content, 'utf8');
    }
}

function generateMetaBlock(scriptName, content) {
    const meta = {
        ...rootMeta,
        ...require(USERSCRIPTS_ROOT + '/' + scriptName + '/meta.json'),
    };

    let metaBlock = '// ==UserScript==\n';
    const fieldPrefix = '// @';

    const maxFieldLength = Math.max(...Object.keys(meta).map((field) => field.length));
    const indent = fieldPrefix.length + Math.max('grant'.length, maxFieldLength) + 2;

    function putField(field, value) {
        let line = fieldPrefix + field;

        if (typeof value === 'string') {
            line = line.padEnd(indent, ' ') + value;
        }

        metaBlock += line + '\n';
    }

    for (const field of metaFields) {
        if (field in meta) {
            putField(field, meta[field]);
        }
    }

    for (const grant of scriptGrants) {
        if (content.includes(grant)) {
            putField('grant', grant);
        }
    }

    metaBlock += '// ==/UserScript==\n';

    return metaBlock + content;
}

function extractCSS(scriptName, content) {
    const match = content.match(/var __vite_style__.+innerHTML = (".+");\n.+appendChild\(__vite_style__\);\n/s);

    if (!match) {
        return content;
    }

    content = content.slice(0, match.index) + content.slice(match.index + match[0].length);

    // should be parsed by eval() because it's actually a string literal
    let css = eval(match[1]);

    // fix inconsistent indents due to CSS nesting
    css = css.replaceAll(/[ ]{5,}/g, '    ');
    css = css.replaceAll(/[ ]+}/g, '}');

    fs.writeFileSync(path.resolve(distDir, scriptName + '.css'), css, 'utf8');

    return content;
}

main();
