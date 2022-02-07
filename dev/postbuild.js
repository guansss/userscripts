const { USERSCRIPTS_ROOT, getGMAPIs } = require('./utils');
const rootMeta = require(USERSCRIPTS_ROOT + '/meta.json');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const { isString, isArray, isBoolean } = require('lodash');

const distDir = path.resolve(__dirname, '../dist/assets');

const mainFunc = '_script_main';

const scriptGrants = getGMAPIs();

// sorted by preference
const META_FIELDS = [
    'name:*',
    'description:*',
    'version',
    'author',
    'namespace',
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

        content = generateMetaBlock(content, name);
        content = extractMainFunc(content);
        content = repositionCSS(content);

        fs.writeFileSync(js, content, 'utf8');
    }
}

function generateMetaBlock(content, scriptName) {
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

        switch (true) {
            case isString(value):
                line = line.padEnd(indent, ' ') + value;
                break;

            case isArray(value):
                line = value.map((singleVal) => line.padEnd(indent, ' ') + singleVal);
                break;

            case isBoolean(value):
                // ignore false
                if (!value) {
                    return;
                }
                break;

            default:
                console.warn('Unknown type of value:', value);
        }

        metaBlock += line + '\n';
    }

    const metaFields = Object.keys(meta);

    for (const field of META_FIELDS) {
        if (field.includes(':*')) {
            const baseField = field.replace(':*', '');
            const i18nFields = metaFields.filter((_field) => _field.startsWith(baseField + ':'));

            if (metaFields.includes(baseField)) {
                putField(baseField, meta[baseField]);
            }

            for (const i18nField of i18nFields) {
                putField(i18nField, meta[i18nField]);
            }
        } else {
            if (metaFields.includes(field)) {
                putField(field, meta[field]);
            }
        }
    }

    for (const grant of scriptGrants) {
        if (content.includes(grant)) {
            putField('grant', grant);
        }
    }

    metaBlock += '// ==/UserScript==\n\n';

    return metaBlock + content;
}

function extractMainFunc(content) {
    const iifeStartPattern = '(function';
    const iifeEndPattern = '})(';

    const start = content.indexOf(iifeStartPattern);
    const end = content.lastIndexOf(iifeEndPattern);

    if (start === -1 || end === -1) {
        throw new Error('Could not find IIFE definition.');
    }

    // prettier-ignore
    content = content.slice(0, start)
        + `function ${mainFunc}`
        + content.slice(start + iifeStartPattern.length, end)
        + `}\n\n${mainFunc}(`
        + content.slice(end + iifeEndPattern.length);

    return content;
}

// moves CSS to the bottom
function repositionCSS(content) {
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

    const mainInvocation = content.search(new RegExp(`^${mainFunc}\\(`, 'm'));

    if (mainInvocation === -1) {
        throw new Error('Could not find invocation of main function.');
    }

    // prettier-ignore
    content = content.slice(0, mainInvocation)
        + `GM_addStyle(\`\n${css}\`);\n\n`
        + content.slice(mainInvocation);

    return content;
}

main();
