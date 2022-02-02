let logger = console.log;

export function setLogger(_logger: typeof console.log) {
    logger = _logger;
}

export function log(...args: any[]) {
    logger(`[${GM_info.script.name}]`, ...args);
}
