// ==UserScript==
// @name        Douyu Script
// @version     0.1
// @author      guansss
// @namespace   https://github.com/guansss
// @source      https://github.com/guansss/userscripts
// @supportURL  https://github.com/guansss/userscripts/issues
// @match       *://www.douyu.com/*
// @noframes
// ==/UserScript==

function _script_main() {
    'use strict';

    const ready = new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => resolve);
        } else {
            resolve();
        }
    });

    ready.then(() => {
        document.addEventListener('mouseleave', onLeave);
    });

    function onLeave(e) {
        var _a;
        if (e.target === document) {
            const stuckComment =
                (_a = document.getElementById('comment-higher-container')) === null || _a === void 0
                    ? void 0
                    : _a.firstElementChild;

            if (stuckComment) {
                document.dispatchEvent(new MouseEvent('mousemove'));
            }
        }
    }
}

_script_main();
