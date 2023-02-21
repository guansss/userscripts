import pullAll from "lodash-es/pullAll"

export interface Scheme {
  url: string | RegExp
  condition?: boolean | (() => boolean)
  css?: string
  run?: () => void | Promise<void>
}

export const schemes: Scheme[] = []

// tree-shakable helpers for handling scheme removal during dev
const unmarkedSchemes: Scheme[] = []
const schemesMap: Record<string, Scheme[]> = {}

export function register(scheme: Scheme) {
  schemes.push(scheme)

  if (__DEV__) {
    unmarkedSchemes.push(scheme)
  }
}

export function markAbove(id: string) {
  schemesMap[id] = unmarkedSchemes.slice()
  unmarkedSchemes.length = 0
}

export function unregister(id: string) {
  pullAll(schemes, schemesMap[id])
}
