import { resolve } from "path"
import svgLoader from "preact-cli-svg-loader"

export default (config, env, helpers, options) => {
  config.output.publicPath = ""
  config.resolve.alias["@"] = resolve("src")
  const sizePlugin = helpers.getPluginsByName(config, "SizePlugin")[0]
  if (sizePlugin) {
    config.plugins.splice(sizePlugin.index, 1)
  }
  if (config.devServer) {
    config.devServer.host = "localhost"
  } else {
    delete config.devtool
  }
  svgLoader(config, helpers)
}
