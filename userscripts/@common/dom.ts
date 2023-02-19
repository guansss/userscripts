export function inIframe() {
    // https://stackoverflow.com/a/326076/13237325
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

export function onClickOutside(el: HTMLElement, callback: (e: MouseEvent) => void) {
    document.addEventListener('click', handler);

    function handler(e: MouseEvent) {
        if (!el.contains(e.target as any)) {
            document.removeEventListener('click', handler);
            callback(e);
        }
    }
}

/**
 * MutationObserver that calls callback with just a single mutation.
 */
export class SimpleMutationObserver extends MutationObserver {
    // since calling `new NodeList()` is illegal, this is the only way to create an empty NodeList
    static emptyNodeList = document.querySelectorAll('#__absolutely_nonexisting');

    constructor(public callback: (mutation: MutationRecord) => boolean | void) {
        super((mutations) => {
            for (const mutation of mutations) {
                if (this.callback(mutation)) {
                    break;
                }
            }
        });
    }

    /**
     * @param options.immediate - When observing "childList", immediately trigger a mutation with existing nodes.
     */
    override observe(target: Node, options?: MutationObserverInit & { immediate?: boolean }): void {
        super.observe(target, options);

        if (options && options.immediate && options.childList && target.childNodes.length) {
            this.callback({
                target,
                type: 'childList',
                addedNodes: target.childNodes,
                removedNodes: SimpleMutationObserver.emptyNodeList,
            } as any as MutationRecord);
        }
    }
}

export function hasClass<E extends HTMLElement = HTMLElement>(node: Node, className: string): node is E {
    return (node as any).classList && (node as HTMLElement).classList.contains(className);
}

export function observeDOM(container: HTMLElement, condition: () => boolean, options?: MutationObserverInit) {
    let observer: MutationObserver | undefined;

    return {
        observation: new Promise<void>((resolve) => {
            if (condition()) {
                resolve();
                return;
            }

            observer = new MutationObserver(() => {
                if (condition()) {
                    resolve();

                    observer?.disconnect();
                }
            });

            observer.observe(container, Object.assign({ childList: true }, options));
        }),
        stopObservation() {
            observer?.disconnect();
        },
    };
}
