export type GMValue = string | number | boolean;

export class Storage<T extends Record<string, GMValue>> {
    get<K extends keyof T & string>(key: K, defaultVal: T[K]): T[K] {
        return GM_getValue(key, defaultVal);
    }

    set<K extends keyof T & string>(key: K, val: T[K]) {
        GM_setValue(key, val);
    }
}
