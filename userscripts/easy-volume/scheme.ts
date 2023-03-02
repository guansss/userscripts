export interface Scheme {
  url: string | RegExp
  condition?: boolean | (() => boolean)
  css?: string
  run?: () => void | Promise<void>
}

export const schemes: Scheme[] = []

export function register(scheme: Scheme) {
  schemes.push(scheme)
}
