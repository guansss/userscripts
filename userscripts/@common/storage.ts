export type GMValue = string | number | boolean | undefined | Record<string, unknown> | GMValue[]

export type StorageSchema = Record<string, GMValue>

export type Storage<S extends StorageSchema> = {
  get<K extends keyof S & string>(key: K): S[K]

  set<K extends keyof S & string>(key: K, val: S[K] | ((oldValue: S[K]) => S[K])): void
}

export function createStorage<S extends StorageSchema>(prefix: string, schema: S): Storage<S> {
  if (prefix) {
    prefix += "."
  }

  return {
    get(key) {
      return GM_getValue(prefix + key, schema[key])
    },
    set(key, val) {
      if (typeof val === "function") {
        val = val(this.get(key))
      }

      GM_setValue(prefix + key, val)
    },
  }
}
