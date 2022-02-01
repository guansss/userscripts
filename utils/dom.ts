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
    constructor(callback: (mutation: MutationRecord) => any) {
        super((mutations) => {
            for (const mutation of mutations) {
                callback(mutation);
            }
        });
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
