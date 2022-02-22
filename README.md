# userscripts

My userscript project. The workflow was somewhat inspired by [rollup-userscript-template](https://github.com/cvzi/rollup-userscript-template).

## Setup

### SSL Certificate

The dev server should run over HTTPS so the served scripts won't be blocked when being loaded from an HTTPS page. Paths of the certificate should be placed in `.env` file, or in `.env.local` file (Git-ignored) with the same content.

Example:

```sh
SSL_KEY=C:\Users\me\ssl\127.0.0.1-key.pem
SSL_CERT=C:\Users\me\ssl\127.0.0.1.pem
```

Certificate can be generated by [mkcert](https://github.com/FiloSottile/mkcert) for local development.

### Dev Script

The Dev Script (`dev/dev.user.js`) is like a router for routing all the scripts in development. Simply open your userscript manager like Tampermonkey and add install this script.

After installation, each developing script will be automatically loaded on its target website(s), matching the `match`, `include` and `exclude` patterns defined in the script's `meta.json`.

Sometimes you may want to run a script on a website that doesn't match, e.g. debugging a script on `http://localhost:3000` while not adding this URL to the patterns. In this case you can open the website and click the userscript manager's icon (typically on the right of address bar), and select the script you want, then it'll load and show a `(force)` mark behind its name. Even if you refresh the page the script will still load. Click the script again to cancel the force load.

## Development

Run this command to start dev server and serve all the scripts.

```sh
yarn dev
```

### Metadata

Script metadata are defined in respective `meta.json` files.

```
.
└── /userscripts
    ├── /script-a
    │   └── meta.json  (Script-specific metadata)
    │
    └── meta.json  (General metadata for all scripts)
```

| Directive type | Definition example                              | Output                                                 |
| -------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Normal         | `"version": "0.1"`                              | `//@version 0.1`                                       |
| Multiple       | `"match": ["http://foo.com", "http://bar.com"]` | `//@match http://foo.com`<br>`//@match http://bar.com` |
| No argument    | `"noframes": true`                              | `//@noframes`                                          |

### I18N

For helping with translations, please edit the files in `i18n` folder, or create a new one with new locale.

```
.
└── /userscripts
    └── /iwara-enhancement
        └── /i18n
            ├── en.json5
            └── zh.json5
```

### HMR

By leveraging Vite, HMR is supported during development.

This project has defined a special API that makes cleaning up modules side effects much more easier. It's written as `__ON_RELOAD__(callback)`, where `callback` will be called once current module is re-executed due to a modification of itself or its dependencies.

```js
const appDiv = document.createElement('div');

document.body.appendChild(appDiv);

__ON_RELOAD__(() => {
    appDiv.remove();
});
```

### Dependencies

**Every dependency should be external** - we don't want any library to be bundled into the script because it'll heavily break the script's readability.

External dependencies should be declared in `vite.config.js` as follows:

```js
module.exports = {
    // ...

    build: {
        rollupOptions: {
            // mark as external
            external: ['vue', 'vue-i18n', 'jquery'],
            output: {
                globals: {
                    // specify global variables
                    vue: 'Vue',
                    'vue-i18n': 'VueI18n',
                    jquery: '$',

                    // specify CDN links
                    ...cdn('vue', 'dist/vue.global.prod.js'),
                    ...cdn('vue-i18n', 'dist/vue-i18n.global.prod.js'),
                    ...cdn('jquery', 'dist/jquery.min.js'),
                },
            },
        },
    },
};
```

During build, they will be converted to `@require` directives:

```js
// @require   https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js
// @require   https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js
// @require   https://cdn.jsdelivr.net/npm/vue-i18n@9/dist/vue-i18n.global.prod.js
```

## Building

```sh
yarn build
```
