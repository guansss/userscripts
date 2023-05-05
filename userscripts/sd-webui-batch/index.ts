import { DEV_ONLY, ON_RELOAD } from "../@common/env"
import { ready } from "../@common/events"
import { enableHMR } from "../@common/hmr"
import "../@common/jquery"
import { log } from "../@common/log"
import { send } from "./send"

ready.then(main)

async function main() {
  if (!unsafeWindow.gradioApp) {
    return
  }

  const originalFetch = unsafeWindow.fetch

  let fetchOptions = unsafeWindow.__lastFetchOptions

  unsafeWindow.fetch = async (url: string, options: RequestInit) => {
    if (
      url.endsWith("run/predict/") &&
      options?.body &&
      JSON.parse(options.body).fn_index === 321
    ) {
      log("recorded")
      fetchOptions = options
      unsafeWindow.__lastFetchOptions = options
    }

    return originalFetch(url, options)
  }

  const input = $(`<input type="file" multiple style="" accept="image/*" />`).prependTo(
    "body"
  ) as JQuery<HTMLInputElement>
  const button = $(`<button>Run</button>`).prependTo("body")
  const stopButton = $(`<button>Stop</button>`)
    .prependTo("body")
    .click(() => (alive = false))
  const status = $(`<div style="color:white"></div>`).prependTo("body")
  const preview = $(`<img style=""/>`).prependTo("body")

  input.on("change", () => {
    status.text(`(${input[0]!.files!.length})`)
  })

  let alive = true

  button.on("click", async () => {
    alive = true

    const maxWidth = 700
    const maxHeight = 700

    const files = input[0]!.files!

    const fileInfo: Record<string, string> = {}

    for (let i = 0; i < files.length; i++) {
      if (!alive) return

      const file = files[i]!

      status.text(`(${i + 1}/${files.length}) ${file.name}`)

      const { image, size } = await new Promise((resolve, reject) => {
        let base64 = ""
        let size = [] as number[]

        const done = () => {
          if (base64 && size.length) {
            resolve({ image: base64, size })
          }
        }

        const reader = new FileReader()

        reader.onload = (e) => {
          base64 = e.target!.result as string
          done()
        }
        reader.onerror = (e) => {
          reject(e)
        }
        reader.readAsDataURL(file)

        const img = new Image()

        img.onload = () => {
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height)
          size = [Math.floor(img.width * scale), Math.floor(img.height * scale)]
          URL.revokeObjectURL(img.src)
          done()
        }
        img.onerror = (e) => {
          reject(e)
        }
        img.src = URL.createObjectURL(file)
      })

      const id = `task(${Math.random()})`

      send({ id, image, size, fetchOptions }).then((filename: string) => {
        fileInfo[file.name] = filename
      })

      while (1) {
        if (!alive) return

        const data = await unsafeWindow
          .fetch("http://sdweb.gzpolpo.net/internal/progress", {
            headers: {
              accept: "*/*",
              "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
              "content-type": "application/json",
            },
            referrer: "http://sdweb.gzpolpo.net/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `{"id_task":"${id}","id_live_preview":-1}`,
            method: "POST",
            mode: "cors",
            credentials: "omit",
          })
          .then((res) => res.json())

        if (data.completed) {
          break
        }

        status.text(`(${i + 1}/${files.length}) ${Math.round(data.progress * 100)}% ${file.name}`)

        if (data.live_preview) {
          preview.attr("src", data.live_preview)
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    status.text(`done`)

    log(fileInfo)

    const resultFile = new File([JSON.stringify(fileInfo)], "result.json", {
      type: "application/json",
    })

    const a = document.createElement("a")
    a.href = URL.createObjectURL(resultFile)
    a.download = resultFile.name
    a.click()
  })

  ON_RELOAD(() => {
    alive = false
    input.remove()
    button.remove()
    stopButton.remove()
    status.remove()
    preview.remove()
    unsafeWindow.fetch = originalFetch
  })
}

DEV_ONLY(() => enableHMR(module))
