import mitt from 'mitt';
import { hasClass, SimpleMutationObserver } from '../../utils/dom';
import { ready } from '../../utils/events';
import { log } from '../../utils/log';
import { getAppDiv } from './common';

const appObserver = new SimpleMutationObserver((mutation) => {
    detectPageChange(mutation.addedNodes, 'pageEnter');
    detectPageChange(mutation.removedNodes, 'pageLeave');
});

ready().then(() => {
    appObserver.observe(getAppDiv()!, { childList: true });
});

type Events = {
    pageEnter: string;
    pageLeave: string;

    // allow removing listeners for HMR
    [k: `off:${string}`]: void;
};
const emitter = mitt<Events>();

if (import.meta.hot && import.meta.hot.data.events) {
    // restore events after HMR
    (import.meta.hot.data.events as typeof emitter.all).forEach((v, k) => emitter.all.set(k, v));
}

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
            const onPageLeave = callIfMatch(leave);

            emitter.on('pageLeave', onPageLeave);

            if (import.meta.hot) {
                emitter.on(`off:${key}`, () => emitter.off('pageLeave', onPageLeave));
            }
        }
    });

    // call immediately and do not proceed if error occurs
    onPageEnter(currentClassName);

    emitter.on('pageEnter', onPageEnter);

    if (import.meta.hot) {
        emitter.on(`off:${key}`, () => emitter.off('pageEnter', onPageEnter));
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

if (DEBUG) {
    const logPageID = (action: string) => (className: string) =>
        ((i: number) => (i === -1 ? undefined : log(action, className.slice(i + 5))))(className.indexOf('page-'));
    const logEnter = logPageID('enter');
    const logLeave = logPageID('leave');
    emitter.on('pageEnter', logEnter);
    emitter.on('pageLeave', logLeave);
    emitter.on('off:logID', () => {
        emitter.off('pageEnter', logEnter);
        emitter.off('pageLeave', logLeave);
    });
}

if (import.meta.hot) {
    import.meta.hot.accept(() => {});
    import.meta.hot.dispose((data) => {
        emitter.emit('off:logID');

        // save events before HMR
        data.events = emitter.all;

        appObserver.disconnect();
    });
}
