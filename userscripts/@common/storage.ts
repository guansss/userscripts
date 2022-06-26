export type GMValue = string | number | boolean | undefined;

export type StorageSchema = Record<string, GMValue>;

export type Storage<S extends StorageSchema> = {
    get<K extends keyof S & string>(key: K): S[K];

    set<K extends keyof S & string>(key: K, val: S[K]): void;
};

export function createStorage<S extends StorageSchema>(schema: S): Storage<S> {
    return {
        get(key) {
            return GM_getValue(key, schema[key]);
        },
        set(key, val) {
            GM_setValue(key, val);
        },
    };
}
