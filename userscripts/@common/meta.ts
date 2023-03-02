import { SetRequired } from "type-fest/source/set-required"

/**
 * @see https://www.tampermonkey.net/documentation.php
 */

export const META_FIELDS = [
  "name",
  "namespace",
  "copyright",
  "version",
  "description",
  "icon",
  "iconURL",
  "defaulticon",
  "icon64",
  "icon64URL",
  "grant",
  "author",
  "homepage",
  "homepageURL",
  "website",
  "source",
  "antifeature",
  "require",
  "resource",
  "include",
  "match",
  "exclude",
  "runAt",
  '"run-at',
  "sandbox",
  "connect",
  "noframes",
  "updateURL",
  "downloadURL",
  "supportURL",
  "webRequest",
  "unwrap",
] as const

export interface ScriptMeta
  extends SetRequired<Partial<Record<MetaFields, string | string[]>>, "name" | "version"> {}

type MetaFields =
  | WithLocalization<"name" | "description">
  | "name"
  | "namespace"
  | "copyright"
  | "version"
  | "description"
  | "icon"
  | "iconURL"
  | "defaulticon"
  | "icon64"
  | "icon64URL"
  | "grant"
  | "author"
  | "homepage"
  | "homepageURL"
  | "website"
  | "source"
  | "antifeature"
  | "require"
  | "resource"
  | "include"
  | "match"
  | "exclude"
  | "runAt"
  | '"run-at'
  | "sandbox"
  | "connect"
  | "noframes"
  | "updateURL"
  | "downloadURL"
  | "supportURL"
  | "webRequest"
  | "unwrap"

type WithLocalization<T extends string> = `${T}:${string}`
