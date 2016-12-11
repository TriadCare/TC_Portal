const webpack 			= require('webpack');
const path 					= require('path');
const rootAssetPath = './assets';

const SRC_ASSETS 		= path.resolve(__dirname, 'assets/');
const SRC_COMMON 		= path.resolve(__dirname, 'webapp/static/');
const SRC_AUTH 			= path.resolve(__dirname, 'webapp/auth/static/');
const SRC_EXECUTIVE = path.resolve(__dirname, 'webapp/executive/static/');
const NODE_MODULES 	= path.resolve(__dirname, 'node_modules/');

const ExtractTextPlugin 			= require('extract-text-webpack-plugin');
const ManifestRevisionPlugin 	= require('manifest-revision-webpack-plugin');
const CleanWebpackPlugin 			= require('clean-webpack-plugin');

const PATHS = {
  dist: path.join(__dirname, 'bundle'),
};

module.exports = {
  entry: {
    auth: `${rootAssetPath}/js/auth.js`,
    executive: `${rootAssetPath}/js/executive.js`,
  },
  output: {
    path: PATHS.dist,  // Build Destination
    publicPath: 'https://stage.triadcare.com/bundle/',
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
        loader: ExtractTextPlugin.extract('style', 'css', 'resolve-url'),
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
    new ManifestRevisionPlugin(path.join('bundle', 'webpack_manifest.json'), {
      rootAssetPath,
      ignorePaths: ['/js', '/css', '/fonts'],
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    }),
    new ExtractTextPlugin('[name].[chunkhash].css'),
    new webpack.optimize.CommonsChunkPlugin({
      filename: 'common.js',
      name: 'common',
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new CleanWebpackPlugin(['bundle'], {
      verbose: true,
      exclude: ['webpack_manifest.json'],
    }),
  ],
};
