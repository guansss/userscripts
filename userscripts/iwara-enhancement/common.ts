import mitt from 'mitt';
import { ready } from '../../utils/events';
import { log } from '../../utils/log';

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

// page listener for iwara
export function page(id: string | string[], key: string, listener: (id: string) => void) {
    const match =
        typeof id === 'string'
            ? (className: string) => (className.includes(id) ? id : undefined)
            : (className: string) => id.find((_id) => className.includes(_id)) || undefined;

    function onPageEnter(className: string) {
        const matchedID = match(className);

        if (matchedID) {
            try {
                listener(matchedID);
            } catch (e) {
                log('Error executing page listener', e);
            }
        }
    }

    // call immediately
    onPageEnter(currentClassName);

    emitter.on('pageEnter', onPageEnter);

    if (import.meta.hot) {
        emitter.on(`off:${key}`, () => emitter.off('pageEnter', onPageEnter));
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
            if ((node as any).classList?.length >= 2 && (node as HTMLDivElement).classList.contains('page')) {
                emitter.emit(event, (node as HTMLDivElement).className);
                break;
            }
        }
    }
}

export function getAppDiv() {
    return document.getElementById('app') as HTMLDivElement | null;
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
