import mitt from 'mitt';
import { hasClass, SimpleMutationObserver } from '../../utils/dom';
import { once, ready } from '../../utils/events';
import { onExit } from '../../utils/hmr';
import { log } from '../../utils/log';
import { getAppDiv } from './common';

const appObserver = new SimpleMutationObserver((mutation) => {
    detectPageChange(mutation.addedNodes, 'pageEnter');
    detectPageChange(mutation.removedNodes, 'pageLeave');
});

export function setupPaging() {
    ready().then(() => {
        const appDiv = getAppDiv()!;

        dispatchExistingPage(appDiv);

        log('Start observing pages.');

        appObserver.observe(appDiv, { childList: true });
    });
}

type Events = {
    pageEnter: string;
    pageLeave: string;

    // allow removing listeners for HMR
    [k: `off:${string}`]: void;
};
const emitter = mitt<Events>();

let currentClassName = '';

emitter.on('pageEnter', (className) => (currentClassName = className));

type PageListener = (id: string) => void;
type PageEnterListener = (id: string, onLeave: (fn: PageListener) => void) => void;

// page listener for iwara
export function page(id: string | string[], key: string, enter: PageEnterListener) {
    const match =
        typeof id === 'string'
            ? (className: string) => (className.includes(id) ? id : undefined)
            : (className: string) => id.find((_id) => className.includes(_id)) || undefined;

    function callIfMatch(listener: PageListener) {
        return (className: string) => {
            const matchedID = match(className);

            if (matchedID !== undefined) {
                try {
                    listener(matchedID);
                } catch (e) {
                    log('Error executing page listener', e);
                }
            }
        };
    }

    const onPageEnter = callIfMatch((matchedID) => {
        let leave: PageListener | undefined;

        enter(matchedID, (fn) => (leave = fn));

        if (typeof leave === 'function') {
            once(emitter, 'pageLeave', callIfMatch(leave));
        }
    });

    emitter.on('pageEnter', onPageEnter);

    if (import.meta.hot) {
        emitter.on(`off:${key}`, () => emitter.off('pageEnter', onPageEnter));
    }
}

export function dispatchExistingPage(app: HTMLElement) {
    const className = $(app).children('.page').attr('class');

    if (className) {
        emitter.emit('pageEnter', className);
    }
}

// tree-shakable helper for other modules to remove listeners before HMR
export function unpage(key: string) {
    emitter.emit(`off:${key}`);
}

function detectPageChange(nodes: NodeList, event: keyof Events) {
    if (nodes.length) {
        for (const node of nodes as any as Iterable<Node>) {
            // a valid class name will be like "page page-videoList", where "videoList" is the ID
            if (hasClass(node, 'page')) {
                emitter.emit(event, node.className);
                break;
            }
        }
    }
}

if (__DEV__) {
    const logPageID = (action: string) => (className: string) =>
        ((i: number) => (i === -1 ? undefined : log(action, className.slice(i + 5))))(className.indexOf('page-'));
    const logEnter = logPageID('enter');
    const logLeave = logPageID('leave');
    emitter.on('pageEnter', logEnter);
    emitter.on('pageLeave', logLeave);
}

if (import.meta.hot) {
    onExit(() => {
        if (currentClassName) {
            emitter.emit('pageLeave', currentClassName);
        }

        appObserver.disconnect();
    });
}
