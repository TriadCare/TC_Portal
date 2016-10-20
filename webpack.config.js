const webpack 			= require('webpack');
const path 					= require('path');
const rootAssetPath = './assets';

const SRC_ASSETS 		= path.resolve(__dirname, 'assets/');
const SRC_COMMON 		= path.resolve(__dirname, 'webapp/static/');
const SRC_ADMIN 		= path.resolve(__dirname, 'webapp/admin/static/');
const SRC_AUTH 			= path.resolve(__dirname, 'webapp/auth/static/');
const SRC_PATIENT 	= path.resolve(__dirname, 'webapp/patient/static/');
const NODE_MODULES 	= path.resolve(__dirname, 'node_modules/');

const ExtractTextPlugin 			= require('extract-text-webpack-plugin');
const ManifestRevisionPlugin 	= require('manifest-revision-webpack-plugin');
const CleanWebpackPlugin 			= require('clean-webpack-plugin');

const PATHS = {
  dist: path.join(__dirname, 'bundle'),
};

module.exports = {
  entry: {
    // admin: 'admin/static/src/admin.js',
    auth: `${rootAssetPath}/js/auth.js`,
    patient: `${rootAssetPath}/js/patient.js`,
    //provider: 'provider/static/src/provider.js'
  },
  output: {
    path: PATHS.dist,  // Build Destination
    publicPath: 'http://localhost:8080/bundle/',
    filename: '[name].[chunkhash].js',
    chunkFilename: '[id].[chunkhash].js',
  },
  eslint: {
    emitWarning: true,
  },
  resolve: {
    // Allows requiring files without supplying the extensions
    root: [SRC_ASSETS, SRC_COMMON, SRC_ADMIN, SRC_AUTH, SRC_PATIENT, NODE_MODULES],
    extensions: ['', '.js', '.jsx', '.json', '.css'],
  },
  devtool: 'source-map',
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
        loaders: ['react-hot', 'babel-loader'],
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css', 'resolve-url'),
      },
      {
        test: /\.(jpe?g|png|gif|svg([\?]?.*))$/i,
        loaders: [
          `file?context=${SRC_ASSETS}/media/&name=[path][name].[hash].[ext]`,
          'image?bypassOnDebug&optimizationLevel=7&interlaced=false',
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'file?name=public/fonts/[name].[ext]',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: process.env.NODE_ENV,
      },
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
