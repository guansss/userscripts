import mitt from "mitt"
import { hasClass, SimpleMutationObserver } from "../../@common/dom"
import { DEV_ONLY, ON_RELOAD } from "../../@common/env"
import { once, ready } from "../../@common/events"
import { log } from "../../@common/log"

export function setupPaging() {
  ready.then(() => {
    const appDiv = document.getElementById("app") as HTMLElement | null

    if (!appDiv) {
      log("Missing app div.")
      return
    }

    log("Start observing pages.")

    const appObserver = new SimpleMutationObserver((mutation) => {
      detectPageChange(appDiv, mutation.addedNodes, "pageEnter")
      detectPageChange(appDiv, mutation.removedNodes, "pageLeave")
    })
    appObserver.observe(appDiv, { childList: true, immediate: true })

    ON_RELOAD(() => {
      if (currentClassName) {
        emitter.emit("pageLeave", currentClassName)
        currentClassName = ""
      }

      appObserver.disconnect()
    })
  })
}

type Events = {
  pageEnter: string
  pageLeave: string

  // allow removing listeners for HMR
  [k: `off:${string}`]: void
}
const emitter = mitt<Events>()

let currentClassName = ""

emitter.on("pageEnter", (className) => (currentClassName = className))

type IDArg = string | readonly string[]
type IDMatch<ID extends IDArg> = ID extends string ? ID : ID[number]

type PageListener<ID extends IDArg> = (id: IDMatch<ID>) => void
type PageEnterListener<ID extends IDArg> = (
  id: IDMatch<ID>,
  onLeave: (fn: PageListener<ID>) => void
) => void

export const ALL = "*"

// page listener for iwara
export function page<ID extends IDArg>(id: ID, enter: PageEnterListener<ID>) {
  const match = (() => {
    if (id === ALL) {
      return () => id
    }

    const ids: readonly string[] = typeof id === "string" ? [id] : id
    const classes = ids.map((id) => `page-${id}`)

    return (className: string) => {
      const split = className.split(" ")
      const index = classes.findIndex((cls) => split.includes(cls))

      return ids[index]
    }
  })()

  function callIfMatch(listener: PageListener<ID>) {
    return (className: string) => {
      const matchedID = match(className)

      if (matchedID !== undefined) {
        try {
          listener(matchedID as IDMatch<ID>)
        } catch (e) {
          log("Error executing page listener", e)
        }
      }
    }
  }

  const onPageEnter = callIfMatch((matchedID) => {
    enter(matchedID, (onLeave) => {
      once(emitter, "pageLeave", callIfMatch(onLeave))
    })
  })

  emitter.on("pageEnter", onPageEnter)
}

function detectPageChange(appDiv: HTMLElement, nodes: NodeList, event: keyof Events) {
  if (nodes.length) {
    for (const node of nodes as any as Iterable<Node>) {
      // a valid class name will be like "page page-videoList", where "videoList" is the ID
      if (hasClass(node, "page")) {
        // sometimes there are two (maybe more) "page" elements, and one of them contains only the "page" class,
        // we ignore it in this case
        const hasOtherPageElements =
          $(appDiv)
            .children(".page")
            .filter((_, e) => e !== node).length > 0

        if (!hasOtherPageElements) {
          emitter.emit(event, node.className)
        }
        break
      }
    }
  }
}

DEV_ONLY(() => {
  const logPageID = (action: string) => (className: string) =>
    ((i: number) => log(action, i === -1 ? "<void>" : className.slice(i + 5)))(
      className.indexOf("page-")
    )
  emitter.on("pageEnter", logPageID("enter"))
  emitter.on("pageLeave", logPageID("leave"))
})
