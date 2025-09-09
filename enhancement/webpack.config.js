const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./src/index.tsx",
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.(css|scss)$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.wasm$/,
        type: "javascript/auto",
      },
      {
        test: /\.m?js$/, // Fix xlsx ESM fully specified imports
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx",".mjs"],
    alias: {
    "process/browser": require.resolve("process/browser.js"), // 👈 force .js
  },
    fallback: {
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
      process: require.resolve("process/browser"),
    },
  },
  optimization: {
    minimize: true,
    minimizer: [`...`, new CssMinimizerPlugin()],
    splitChunks: { chunks: "all" },
    runtimeChunk: "single",
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].[contenthash].css" }),
    new CompressionPlugin({ algorithm: "brotliCompress" }),
    new BundleAnalyzerPlugin({
      analyzerMode: "server",
      openAnalyzer: true,
      analyzerPort: 8888,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "node_modules/sql.js/dist/sql-wasm.wasm",
          to: "sql-wasm.wasm",
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser", // polyfill process
      Buffer: ["buffer", "Buffer"], // polyfill Buffer
    }),
    
  ],
  node: false,
};
