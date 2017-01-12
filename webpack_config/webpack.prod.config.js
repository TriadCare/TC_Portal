const webpack 		    	= require('webpack');
const webpackConfig		  = require('webpack-config');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = new webpackConfig.Config()
.extend('./webpack_config/webpack.base.config.js')
.merge({
  output: {
    publicPath: 'https://my.triadcare.com/bundle/',
  },
  eslint: {
    emitWarning: true,
  },
  module: {
    loaders: {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css', 'resolve-url'),
    },
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    }),
    new ExtractTextPlugin('[name].[chunkhash].css'),
  ],
});
