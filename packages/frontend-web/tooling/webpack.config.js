/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const path = require('path');
const webpack = require('webpack');
const config = require('@conversationai/moderator-config').config;

module.exports = {
  target: 'web',

  entry: {
    moderator: [
      `webpack-dev-server/client?http://0.0.0.0:${config.get('port')}`,
      'webpack/hot/only-dev-server',
      './dist/app/main'
    ]
  },

  output: {
    path: path.join(__dirname, "..", "build", "public"),
    filename: "js/[name].js"
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'source-map-loader',
        enforce: 'pre'
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
        enforce: 'post'
      }
    ]
  },

  devtool: "eval",

  resolve: {
    extensions: [".web.js", ".js", ".jsx"],
    alias: {
      'aphrodite': 'aphrodite/no-important'
    }
  },

  plugins: [
    new webpack.PrefetchPlugin("react"),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      __DEVELOPMENT__: false,
      __DEVPANEL__: true,
      ENV_API_URL: process.env['API_URL'] ? "'" + (process.env['API_URL']) + "'" : undefined,
      ENV_APP_NAME: "'" + (process.env['APP_NAME'] || 'Moderator') + "'",
      ENV_REQUIRE_REASON_TO_REJECT: (process.env['REQUIRE_REASON_TO_REJECT'] || true),
      ENV_RESTRICT_TO_SESSION: (process.env['RESTRICT_TO_SESSION'] || true),
      ENV_MODERATOR_GUIDELINES_URL: "'" + (process.env['MODERATOR_GUIDELINES_URL'] || '') + "'",
      ENV_SUBMIT_FEEDBACK_URL: "'" + (process.env['SUBMIT_FEEDBACK_URL'] || '') + "'"
    }),
  ],

  devServer: {
    contentBase: path.join(__dirname, "..", "public"),
    port: config.get('port'),
  },
};
