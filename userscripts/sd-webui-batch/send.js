import mask from "./mask.txt?raw"

export async function send({ id, image, size, fetchOptions }) {
  const fetch = (url, data) => {
    console.log(url, data)
    return unsafeWindow.fetch(url, data)
  }

  await fetch("http://sdweb.gzpolpo.net/run/predict/", {
    headers: {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "content-type": "application/json",
    },
    referrer: "http://sdweb.gzpolpo.net/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: '{"fn_index":211,"data":[],"session_hash":"1arapcamv9f"}',
    method: "POST",
    mode: "cors",
    credentials: "omit",
  })

  await fetch("http://sdweb.gzpolpo.net/run/predict/", {
    headers: {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "content-type": "application/json",
    },
    referrer: "http://sdweb.gzpolpo.net/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: '{"fn_index":212,"data":[],"session_hash":"1arapcamv9f"}',
    method: "POST",
    mode: "cors",
    credentials: "omit",
  })

  const options = fetchOptions

  const body = JSON.parse(options.body)

  body.session_hash = "1arapcamv9f"

  body.data[0] = id
  body.data[5] = image
  body.data[30] = size[1]
  body.data[31] = size[0]
  body.data[50].image = image
  body.data[50].mask = mask

  body.data[136] = []
  body.data[137] = JSON.stringify({
    ...JSON.parse(body.data[137]),
    width: size[0],
    height: size[1],
  })

  const data = await fetch("http://sdweb.gzpolpo.net/run/predict/", {
    ...options,
    body: JSON.stringify(body),
  }).then((res) => res.json())

  return data.data[0][0].name
}
