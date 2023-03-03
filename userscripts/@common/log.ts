import { DEV_ONLY } from "./env"

let log: typeof console.log

setLogger(console.log)

export function setLogger(logger: typeof console.log) {
  log = logger.bind(console, `[${GM_info.script.name}]`)

  // colorful logs are good, but not everyone like it, so we only enable it in dev mode
  DEV_ONLY(() => {
    const tagged = tag(GM_info.script.name, "#0078d7")

    log = logger.bind(console, ...tagged)
  })
}

export function tag(text: string, color: string) {
  return [`%c${text}`, `background: ${color}; color: white; padding: 2px 4px;`]
}

export { log }
