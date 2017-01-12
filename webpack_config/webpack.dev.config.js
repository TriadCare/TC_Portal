const webpack		     = require('webpack');
const webpackConfig	 = require('webpack-config');

module.exports = new webpackConfig.Config()
.extend('./webpack_config/webpack.base.config.js')
.merge({
  output: {
    publicPath: 'http://localhost:8080/bundle/',
  },
  eslint: {
    emitWarning: true,
  },
  devServer: {
    inline: true,
    hot: true,
  },
  devtool: 'source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
});
