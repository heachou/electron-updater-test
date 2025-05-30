// eslint-disable-next-line @typescript-eslint/no-require-imports
const { smallestBuilder } = require('electron-smallest-updater')

exports.default = async (context) => {
  return smallestBuilder(context, {})
}
