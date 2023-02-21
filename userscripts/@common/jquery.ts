import jQuery from "jquery"

declare global {
  interface Window {
    $: typeof jQuery
  }
}

// we'll be loading jQuery via CDN in production, which already exposes itself to window.$,
// then the following code can be omitted so that jQuery is not imported at all, allowing
// the import helper that Rollup generates for jQuery to be tree-shaken
if (__DEV__) {
  window.$ = jQuery
}
