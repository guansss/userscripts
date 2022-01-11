export function repeat(fn: () => boolean | void, interval = 200) {
    if (fn()) {
        return 0;
    }

    const id = setInterval(() => {
        try {
            fn() && clearInterval(id);
        } catch (e) {
            clearInterval(id);
        }
    }, interval);

    return id;
}

// non-cancelable
export function repeatUntil<T>(fn: () => T, interval = 200): Promise<T> {
    return new Promise((resolve, reject) => repeat(() => {
        try {
            const result = fn();

            if (result) {
                resolve(result);

                // break the repeat() loop
                return true;
            }
        } catch (e) {
            reject(e);
            return true;
        }
    }, interval));
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
