export function log(...args: any[]) {
    console.log(`[${GM_info.script.name}]`, ...args);
}
