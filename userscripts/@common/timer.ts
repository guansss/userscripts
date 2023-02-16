import { onInvalidate } from './hmr';
import { log } from './log';

export interface CancelablePromise<T> extends Promise<T> {
    /**
     * When canceled, the Promise will never resolve/reject (if this method is correctly implemented...).
     */
    cancel(): void;
}

// sometimes I just don't want the script to depend on Lodash...
export function throttle<T extends (...args: any) => any>(fn: T, timeout: number): (...args: Parameters<T>) => void {
    let timer = 0;

    return (...args: Parameters<T>) => {
        if (timer) {
            return;
        }

        timer = setTimeout(() => {
            fn.apply(null, args);

            timer = 0;
        }, timeout);
    };
}

/**
 * Periodically calls given function until it returns true.
 */
export function repeat(fn: () => boolean | void, interval = 200) {
    if (fn()) {
        return 0;
    }

    const id = setInterval(() => {
        try {
            fn() && clearInterval(id);
        } catch (e) {
            log(e);
            clearInterval(id);
        }
    }, interval);

    return id;
}

/**
 * Periodically calls given function until the return value is truthy.
 * @returns A CancelablePromise that resolves with the function's return value when truthy.
 */
export function until<T>(fn: () => T, interval = 0): CancelablePromise<NonNullable<T>> {
    let cancelled = false;

    const promise = new Promise<NonNullable<T>>((resolve, reject) =>
        repeat(() => {
            if (cancelled) {
                return true;
            }

            try {
                const result = fn();

                if (result) {
                    resolve(result as NonNullable<T>);

                    // break the repeat() loop
                    return true;
                }
            } catch (e) {
                reject(e);
                return true;
            }
        }, interval)
    );

    (promise as CancelablePromise<any>).cancel = () => (cancelled = true);

    return promise as CancelablePromise<NonNullable<T>>;
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @returns A Promise that resolves/rejects with given Promise, and rejects on HMR during dev.
 */
export function alive<T>(promise: Promise<T>): Promise<T> {
    return __DEV__
        ? new Promise((resolve, reject) => {
              promise.then(resolve, reject);

              onInvalidate(() => {
                  (promise as CancelablePromise<any>).cancel?.();
                  reject(new Error('Module reloaded.'));
              });
          })
        : promise;
}
