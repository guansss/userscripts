import { ready } from "../@common/events"
import { hookMethod } from "../@common/object"
import { CancelablePromise, until } from "../@common/timer"

const urlRegex = /.*issues\/?$/
const defaultFilters = "is:issue is:open "
const targetFilters = "is:issue"

let currentTask: CancelablePromise<any> | undefined

function cancelCurrentTask() {
  currentTask && currentTask.cancel()
}

function check(url: string) {
  if (urlRegex.test(url)) {
    cancelCurrentTask()

    currentTask = until(() => {
      const input = document.getElementById("js-issues-search") as HTMLInputElement

      if (input && input.parentElement && input.parentElement.tagName === "FORM") {
        // when navigating from pull requests to issues, the input is persisted until navigation completes,
        // so we should ensure the input value is as expected
        if (input.value === defaultFilters) {
          input.value = targetFilters
          input.parentElement.dispatchEvent(new SubmitEvent("submit", { bubbles: true }))

          return true
        }

        // cancel current task whenever the input is changed by user, usually this won't happen
        // since the interval is very short, but just in case the user is Shining Finger
        input.addEventListener("input", cancelCurrentTask, { once: true })
      }
    }, 100)
  }
}

const handleStateChange: typeof history.pushState = (data, unused, url) => {
  if (url instanceof URL) {
    url = url.href
  }

  if (url) {
    check(url)
  }
}

hookMethod(history, "pushState", handleStateChange)
hookMethod(history, "replaceState", handleStateChange)

ready.then(() => check(location.href))
