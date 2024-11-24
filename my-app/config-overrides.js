const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      "process/browser": require.resolve("process/browser"),
      zlib: require.resolve("browserify-zlib"),
      buffer: require.resolve("buffer/"),
      buffer: require.resolve("buffer"),
      crypto: require.resolve("crypto-browserify"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/"),
      assert: require.resolve("assert/"),
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify"),
      fs: require.resolve("browserify-fs"),
      vm: false
    }
  };

  config.plugins = [
    ...(config.plugins || []),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ];

  return config;
};