let log: typeof console.log;

setLogger(console.log);

export function setLogger(_logger: typeof console.log) {
    log = _logger.bind(console, `[${GM_info.script.name}]`);
}

export { log };
