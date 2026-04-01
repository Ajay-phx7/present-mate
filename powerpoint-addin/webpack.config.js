const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = (env, options) => {
  const dev = options.mode === "development";

  // Build dev-server config only when actually serving (not during plain builds)
  let devServerConfig = undefined;
  if (process.env.WEBPACK_SERVE) {
    let httpsOptions = true; // default to built-in self-signed
    try {
      httpsOptions = require("office-addin-dev-certs").getHttpsServerOptions();
    } catch {
      /* certs not yet installed — webpack-dev-server will use its own */
    }
    devServerConfig = {
      hot: true,
      headers: { "Access-Control-Allow-Origin": "*" },
      server: { type: "https", options: httpsOptions },
      port: 3001,
    };
  }

  const config = {
    devtool: dev ? "source-map" : false,
    entry: {
      taskpane: "./src/taskpane/index.tsx",
      commands: "./src/commands/commands.ts",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".html", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [
                  "@babel/preset-env",
                  "@babel/preset-react",
                  "@babel/preset-typescript",
                ],
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["taskpane"],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["commands"],
      }),
    ],
    devServer: devServerConfig,
    output: {
      clean: true,
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
  };

  return config;
};
