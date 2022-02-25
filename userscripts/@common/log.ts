let log: typeof console.log;

setLogger(console.log);

export function setLogger(logger: typeof console.log) {
    log = logger.bind(console, `[${GM_info.script.name}]`);
}

export { log };
