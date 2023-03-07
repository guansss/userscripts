import type { Simplify } from "type-fest"

/**
 * @see https://www.tampermonkey.net/documentation.php
 */

export type ScriptMeta = Simplify<
  Partial<ScriptMetaBase> & {
    [K in (typeof META_FIELDS_REQUIRED)[number]]: ScriptMetaBase[K]
  }
>

type ScriptMetaBase = Simplify<
  {
    [K in (typeof META_FIELDS_WITH_LOCALIZATION)[number]]:
      | string
      | {
          default: string
          [key: string]: string
        }
  } & {
    [K in (typeof META_FIELDS_BOOLEAN)[number]]: boolean
  } & {
    [K in (typeof META_FIELDS_ARRAY)[number]]: string | string[]
  } & {
    [K in (typeof META_FIELDS_STRING)[number]]: string
  }
>

export const META_FIELDS_WITH_LOCALIZATION = [
  //
  "name",
  "description",
] as const

export const META_FIELDS_BOOLEAN = [
  //
  "noframes",
] as const

export const META_FIELDS_ARRAY = [
  "grant",
  "require",
  "resource",
  "include",
  "match",
  "exclude",
  "connect",
  "webRequest",
] as const

export const META_FIELDS_STRING = [
  "namespace",
  "copyright",
  "version",
  "icon",
  "iconURL",
  "defaulticon",
  "icon64",
  "icon64URL",
  "author",
  "homepage",
  "homepageURL",
  "website",
  "source",
  "antifeature",
  "runAt",
  "run-at",
  "sandbox",
  "updateURL",
  "downloadURL",
  "supportURL",
  "unwrap",
] as const

export const META_FIELDS = [
  ...META_FIELDS_WITH_LOCALIZATION,
  ...META_FIELDS_BOOLEAN,
  ...META_FIELDS_ARRAY,
  ...META_FIELDS_STRING,
] as const

const META_FIELDS_REQUIRED = ["name", "version"] as const
