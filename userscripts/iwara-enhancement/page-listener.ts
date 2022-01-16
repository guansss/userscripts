import mitt from 'mitt';
import { ready } from '../../utils/events';
import { log } from '../../utils/log';
import { getAppDiv } from './common';

const appObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        detectPageChange(mutation.addedNodes, 'pageEnter');
        detectPageChange(mutation.removedNodes, 'pageLeave');
    }
});

ready().then(() => {
    appObserver.observe(getAppDiv()!, { childList: true });
});

type Events = {
    pageEnter: string;
    pageLeave: string;

    // allow removing listeners during HMR
    [k: `off:${string}`]: void;
};
const emitter = mitt<Events>();

let currentClassName = '';

emitter.on('pageEnter', (className) => (currentClassName = className));

type PageListener = (id: string) => void;

// page listener for iwara
export function page(id: string | string[], key: string, enter: PageListener, leave?: PageListener) {
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

    const onPageEnter = callIfMatch(enter);
    const onPageLeave = leave && callIfMatch(leave);

    // call immediately and do not proceed if error occurs
    onPageEnter(currentClassName);

    emitter.on('pageEnter', onPageEnter);

    if (onPageLeave) {
        emitter.on('pageLeave', onPageLeave);
    }

    if (import.meta.hot) {
        emitter.on(`off:${key}`, () => {
            emitter.off('pageEnter', onPageEnter);

            if (onPageLeave) {
                emitter.off('pageLeave', onPageLeave);
            }
        });
    }
}

// tree-shakable helper for removing listeners during HMR
export function unpage(key: string) {
    emitter.emit(`off:${key}`);
}

function detectPageChange(nodes: NodeList, event: keyof Events) {
    if (nodes.length) {
        for (const node of nodes as any as Iterable<Node>) {
            // a valid class name will be like "page page-videoList", where "videoList" is the ID
            if ((node as any).classList && (node as HTMLElement).classList.contains('page')) {
                emitter.emit(event, (node as HTMLElement).className);
                break;
            }
        }
    }
}

if (DEBUG) {
    emitter.on('pageEnter', (className) => logPageID('enter', className));
    emitter.on('pageLeave', (className) => logPageID('leave', className));

    function logPageID(action: string, className: string) {
        ((i: number) => (i === -1 ? undefined : log(action, className.slice(i + 5))))(className.indexOf('page-'));
    }
}

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        // persist event listeners
        Object.assign(emitter.all, import.meta.hot!.data.events);
    });
    import.meta.hot.dispose((data) => {
        data.events = emitter.all;

        appObserver.disconnect();

        emitter.emit('pageLeave', currentClassName);
    });
}
