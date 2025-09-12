const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  webpack: {
    alias: {
      "sql.js": "sql.js/dist/sql-wasm.js",
      "process/browser": require.resolve("process/browser.js"), 
    },
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        tls: false,
        net: false,
        path: require.resolve("path-browserify"),
        zlib: require.resolve("browserify-zlib"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser.js"), 
      };

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser.js", 
          Buffer: ["buffer", "Buffer"],
        })
      );

      webpackConfig.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: "node_modules/sql.js/dist/sql-wasm.wasm",
              to: "static/js",
            },
          ],
        })
      );

      return webpackConfig;
    },
  },
};
