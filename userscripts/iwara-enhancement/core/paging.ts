import mitt from 'mitt';
import { hasClass, SimpleMutationObserver } from '../../@common/dom';
import { once, ready } from '../../@common/events';
import { onInvalidate } from '../../@common/hmr';
import { log } from '../../@common/log';

export function setupPaging() {
    ready.then(() => {
        const appDiv = document.getElementById('app') as HTMLElement | null;

        if (!appDiv) {
            log('Missing app div.');
            return;
        }

        log('Start observing pages.');

        const appObserver = new SimpleMutationObserver((mutation) => {
            detectPageChange(mutation.addedNodes, 'pageEnter');
            detectPageChange(mutation.removedNodes, 'pageLeave');
        });
        appObserver.observe(appDiv, { childList: true, immediate: true });

        if (__DEV__) {
            onInvalidate(() => {
                if (currentClassName) {
                    emitter.emit('pageLeave', currentClassName);
                    currentClassName = '';
                }

                appObserver.disconnect();
            });
        }
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

type IDArg = string | readonly string[];
type IDMatch<ID extends IDArg> = ID extends string ? ID : ID[number];

type PageListener<ID extends IDArg> = (id: IDMatch<ID>) => void;
type PageEnterListener<ID extends IDArg> = (id: IDMatch<ID>, onLeave: (fn: PageListener<ID>) => void) => void;

// page listener for iwara
export function page<ID extends IDArg>(id: ID, key: string, enter: PageEnterListener<ID>) {
    const match =
        typeof id === 'string'
            ? (className: string) => (className.includes(id) ? id : undefined)
            : (className: string) => id.find((_id) => className.includes(_id)) || undefined;

    function callIfMatch(listener: PageListener<ID>) {
        return (className: string) => {
            const matchedID = match(className);

            if (matchedID !== undefined) {
                try {
                    listener(matchedID as IDMatch<ID>);
                } catch (e) {
                    log('Error executing page listener', e);
                }
            }
        };
    }

    const onPageEnter = callIfMatch((matchedID) => {
        let leave: PageListener<ID> | undefined;

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
    emitter.on('pageEnter', logPageID('enter'));
    emitter.on('pageLeave', logPageID('leave'));
}
