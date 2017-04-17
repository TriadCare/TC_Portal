const webpack = require('webpack');
const path = require('path');

const rootAssetPath = './assets';

const SRC_ASSETS = path.resolve(__dirname, 'assets/');
const SRC_COMMON = path.resolve(__dirname, 'webapp/static/');
const SRC_ADMIN = path.resolve(__dirname, 'webapp/admin/static/');
const SRC_AUTH = path.resolve(__dirname, 'webapp/auth/static/');
const SRC_PATIENT = path.resolve(__dirname, 'webapp/patient/static/');
const SRC_EXECUTIVE = path.resolve(__dirname, 'webapp/executive/static/');
const NODE_MODULES = path.resolve(__dirname, 'node_modules/');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const PATHS = {
  dist: path.join(__dirname, 'bundle'),
};

module.exports = {
  entry: {
    // admin: 'admin/static/src/admin.js',
    auth: `${rootAssetPath}/js/auth.js`,
    executive: `${rootAssetPath}/js/executive.js`,
    patient: `${rootAssetPath}/js/patient.js`,
    //provider: `${rootAssetPath}/js/provider.js`,
  },
  output: {
    path: PATHS.dist,  // Build Destination
    publicPath: 'http://localhost:8080/bundle/',
    filename: '[name].[chunkhash].js',
    chunkFilename: '[id].[chunkhash].js',
  },
  resolve: {
    // Allows requiring files without supplying the extensions
    modules: [
      SRC_ASSETS, SRC_COMMON, SRC_ADMIN, SRC_AUTH,
      SRC_PATIENT, SRC_EXECUTIVE, NODE_MODULES,
    ],
    extensions: ['.js', '.jsx', '.json', '.css'],
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          emitWarning: true,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{ loader: 'css-loader' }, { loader: 'resolve-url-loader' }],
        }),
      },
      {
        test: /\.(jpe?g|png|gif([?]?.*))$/i,
        use: [
          {
            loader: 'file-loader',
            query: {
              context: `${SRC_ASSETS}/media/`,
              name: '[path][name].[hash].[ext]',
            },
          },
          {
            loader: 'image-webpack-loader',
            query: {
              optipng: { optimizationLevel: 7 },
              gifsicle: { interlaced: false },
            },
          },
        ],
      },
      {
        test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          mimetype: 'application/font-woff',
        },
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          mimetype: 'application/octet-stream',
        },
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          mimetype: 'image/svg+xml',
        },
      },
    ],
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname,
        output: {
          path: PATHS.dist,  // Build Destination
        },
      },
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new ManifestRevisionPlugin(path.join('bundle', 'webpack_manifest.json'), {
      rootAssetPath,
      ignorePaths: ['/js', '/css', '/fonts'],
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    }),
    new ExtractTextPlugin({
      filename: '[name].[chunkhash].css',
      allChunks: true,
      disable: false,
    }),
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
