const { promisify } = require("util")
const glob = promisify(require("glob"))
const JSON5 = require("json5")
const path = require("path")
const fs = require("fs")
const { getUserscriptDir } = require("./utils")

function getLocaleFiles(filePath) {
  return glob.sync(getUserscriptDir(filePath) + "/i18n/*.json5")
}

function getLocales(filePath) {
  const locales = {}

  for (const localeFile of getLocaleFiles(filePath)) {
    const filename = path.basename(localeFile)
    const localeName = filename.slice(0, filename.indexOf("."))
    const content = fs.readFileSync(localeFile, "utf8")

    locales[localeName] = JSON5.parse(content)
  }

  return locales
}

module.exports = {
  getLocales,
  getLocaleFiles,
}
