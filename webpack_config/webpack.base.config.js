const webpack 			= require('webpack');
const webpackConfig = require('webpack-config');
const path 					= require('path');

const APP_ROOT 			= path.resolve(__dirname, '../');
const rootAssetPath = './assets';

const SRC_ASSETS 		= path.resolve(APP_ROOT, 'assets/');
const SRC_COMMON 		= path.resolve(APP_ROOT, 'webapp/static/');
const SRC_AUTH 			= path.resolve(APP_ROOT, 'webapp/auth/static/');
const SRC_EXECUTIVE = path.resolve(APP_ROOT, 'webapp/executive/static/');
const NODE_MODULES 	= path.resolve(APP_ROOT, 'node_modules/');

const ManifestRevisionPlugin 	= require('manifest-revision-webpack-plugin');
const CleanWebpackPlugin 			= require('clean-webpack-plugin');

module.exports = new webpackConfig.Config().merge({
  entry: {
    // admin: 'admin/static/src/admin.js',
    auth: `${rootAssetPath}/js/auth.js`,
    executive: `${rootAssetPath}/js/executive.js`,
    //patient: `${rootAssetPath}/js/patient.js`,
    //provider: `${rootAssetPath}/js/provider.js`,
  },
  output: {
    path: '/bundle',  // Build Destination
    filename: '[name].[chunkhash].js',
    chunkFilename: '[id].[chunkhash].js',
  },
  resolve: {
    // Allows requiring files without supplying the extensions
    root: [
      SRC_ASSETS, SRC_COMMON, SRC_AUTH,
      SRC_EXECUTIVE, NODE_MODULES,
    ],
    extensions: ['', '.js', '.jsx', '.json', '.css'],
  },
  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        loaders: ['eslint-loader'],
        exclude: /node_modules/,
      },
    ],
    loaders: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: ['babel-loader'],
      },
      {
        test: /\.json$/,
        loader: 'json',
      },
      {
        test: /\.css$/,
        loader: 'style!css!resolve-url',
      },
      {
        test: /\.(jpe?g|png|gif([\?]?.*))$/i,
        loaders: [
          `file?context=${SRC_ASSETS}/media/&name=[path][name].[hash].[ext]`,
          'image?bypassOnDebug&optimizationLevel=7&interlaced=false',
        ],
      },
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream',
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file',
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    new ManifestRevisionPlugin('bundle/webpack_manifest.json', {
      rootAssetPath,
      ignorePaths: ['/js', '/css', '/fonts'],
    }),
    new CleanWebpackPlugin(['bundle'], {
      root: APP_ROOT,
      verbose: true,
      exclude: ['webpack_manifest.json'],
    }),
    new webpack.optimize.CommonsChunkPlugin({
      filename: 'common.js',
      name: 'common',
    }),
  ],
});
