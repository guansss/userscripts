const { USERSCRIPTS_ROOT, getGMAPIs } = require('./utils');
const rootMeta = require(USERSCRIPTS_ROOT + '/meta.json');
const { isString, isArray, isBoolean } = require('lodash');
const path = require('path');
const prettier = require('prettier');

const prettierConfigAsync = prettier.resolveConfig(__dirname);

const mainFunc = '_script_main';

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
    'require',
    'match',
    'exclude',
    'run-at',
    'grant',
    'noframes',
];

exports.transformChunk = async function ({ chunk, config }) {
    const scriptName = path.dirname(path.relative(USERSCRIPTS_ROOT, chunk.facadeModuleId));

    let content = chunk.code;

    content = extractMainFunc(content);
    content = moveCSSToBottom(content);

    // metadata should be generated lastly because other functions may insert GM APIs requiring @grant to the content
    content = generateMetaBlock(content, { scriptName, chunk, config });

    content = prettier.format(content, {
        ...(await prettierConfigAsync),
        parser: 'babel',
    });

    chunk.code = content;
};

function generateMetaBlock(content, { scriptName, chunk, config }) {
    const meta = {
        ...rootMeta,
        ...require(path.join(USERSCRIPTS_ROOT, scriptName, 'meta.json')),
    };

    let metaBlock = '// ==UserScript==\n';
    const fieldPrefix = '// @';

    const metaFields = Object.keys(meta);
    const maxFieldLength = Math.max(...['grant', 'require', ...metaFields].map((field) => field.length));
    const indent = fieldPrefix.length + maxFieldLength + 2;

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
        } else if (field === 'grant') {
            for (const api of getGMAPIs()) {
                if (content.includes(api)) {
                    putField('grant', api);
                }
            }
        } else if (field === 'require') {
            for (const external of chunk.imports) {
                const cdn = config.build.rollupOptions.output.globals['__' + external];

                if (!cdn) {
                    throw new Error(`Missing CDN link for external dependency "${external}".`);
                }

                putField('require', cdn);
            }
        } else {
            if (metaFields.includes(field)) {
                putField(field, meta[field]);
            }
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

function moveCSSToBottom(content) {
    const match = content.match(/var __vite_style__.+?innerHTML = (".+");.+?\(__vite_style__\);/);

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
