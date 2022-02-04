// ==UserScript==
// @name         Dev script
// @version      0.1
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_info
// @grant        unsafeWindow
// ==/UserScript==

(async function () {
    ('use strict');

    // when in dev mode, we need to expose the GM APIs to unsafeWindow
    // so they can be referenced by modules imported by import(),
    // which are executed outside the userscript scope
    unsafeWindow.__GM = Object.fromEntries(
        [
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
        ].map((api) => [api, window[api]])
    );

    // prevent Sentry from tracking the console during dev because it breaks the log trace
    ['debug', 'info', 'warn', 'error', 'log', 'assert'].forEach((key) => {
        if (unsafeWindow.console[key].__sentry_original__) {
            unsafeWindow.console[key] = unsafeWindow.console[key].__sentry_original__;
        } else {
            const fn = unsafeWindow.console[key];
            Object.defineProperty(unsafeWindow.console, key, {
                set() {
                    // prevent assignment
                },
                get() {
                    return fn;
                },
            });
        }
    });

    // fully disable Sentry, I'm not 100% sure this works

    unsafeWindow.__SENTRY__ = {
        extensions: {},
    };

    let hub;

    Object.defineProperty(unsafeWindow.__SENTRY__, 'hub', {
        set(_hub) {
            hub = _hub;
            hub.getClient = () => undefined;
        },
        get() {
            return hub;
        },
    });

    WebSocket.prototype._addEventListener = WebSocket.prototype.addEventListener;
    WebSocket.prototype.addEventListener = function (type, listener, options) {
        // stop vite from calling location.reload() when socket closed, which typically happens
        // when HMR is not set up correctly, and causes vite to reload the page endlessly
        if (type === 'close' && ('' + listener).includes('[vite] server connection lost. polling for restart')) {
            this._addEventListener(
                'close',
                () => console.warn('Dev serve connection lost, please manually reload the page.'),
                options
            );
            return;
        }
        this._addEventListener(type, listener, options);
    };

    const host = 'https://127.0.0.1:3000';
    const loadedScripts = [];
    const allScripts = [];

    fetch(host + '/@userscripts/all')
        .then((res) => res.json())
        .then((scripts) => {
            const forceLoads = getForceLoads();

            allScripts.push(...scripts);
            allScripts.forEach((script) => {
                if (forceLoads.includes(script.name)) {
                    loadScript(script);
                }
            });

            updateMenu();
        });

    fetch(host + '/@userscripts/match')
        .then((res) => res.json())
        .then((scripts) => {
            scripts.forEach(loadScript);
            updateMenu();
        });

    function getForceLoads() {
        return GM_getValue('force', {})[location.origin] || [];
    }

    function saveForceLoads(forceLoads) {
        GM_setValue('force', {
            ...GM_getValue('force', {}),
            [location.origin]: forceLoads,
        });
    }

    function loadScript(script) {
        if (loadedScripts.includes(script)) {
            return;
        }

        console.log('Loading script:', script.name);

        loadedScripts.push(script);

        import(host + '/' + script.url);
    }

    function updateMenu() {
        const forceLoads = getForceLoads();

        console.log(allScripts, loadedScripts, forceLoads);

        allScripts.forEach((script) => {
            let label = '';

            if (loadedScripts.includes(script)) {
                label += '[x] ';
            } else {
                label += '[ ] ';
            }

            label += script.name;

            if (forceLoads.includes(script.name)) {
                label += ' (force)';
            }

            if (script.label !== label) {
                script.label = label;

                if (script.menuID) {
                    GM_unregisterMenuCommand(script.menuID);
                }

                script.menuID = GM_registerMenuCommand(label, createToggler(script));
            }
        });
    }

    function createToggler(script) {
        return () => {
            const forceLoads = getForceLoads();

            // toggle the state
            const shouldForce = !forceLoads.includes(script.name);

            if (shouldForce) {
                forceLoads.push(script.name);
                loadScript(script);
            } else {
                forceLoads.splice(forceLoads.indexOf(script.name), 1);
            }

            saveForceLoads(forceLoads);
            updateMenu();
        };
    }
})();
