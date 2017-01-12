const WebpackConfig = require('webpack-config');

const config = `./webpack_config/webpack.${process.env.npm_lifecycle_event}.config.js`;

module.exports = new WebpackConfig.Config().extend(config);
