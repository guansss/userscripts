export type OnExitCallback = () => void;

const onExitCallbacks: OnExitCallback[] = [];

export function onExit(fx: OnExitCallback) {
    onExitCallbacks.push(fx);
}

export function exit() {
    onExitCallbacks.forEach((cb) => cb());
}
