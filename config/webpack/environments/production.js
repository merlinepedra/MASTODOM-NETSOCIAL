const { resolve } = require('path');
const { merge } = require('shakapacker');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { InjectManifest } = require('workbox-webpack-plugin');
const baseConfig = require('./base');

const root = resolve(__dirname, '..', '..', '..');

/** @type {import('webpack').Configuration} */
const productionConfig = {
  plugins: [
    new BundleAnalyzerPlugin({ // generates report.html
      analyzerMode: 'static',
      openAnalyzer: false,
      logLevel: 'silent', // do not bother Webpacker, who runs with --json and parses stdout
    }),
    new InjectManifest({
      exclude: [
        /(?:base|extra)_polyfills-.*\.js$/,
        /locale_.*\.js$/,
      ],
      include: [/\.js$/, /\.css$/],
      maximumFileSizeToCacheInBytes: 2 * 1_024 * 1_024, // 2 MiB
      swDest: resolve(root, 'public', 'packs', 'sw.js'),
      swSrc: resolve(root, 'app', 'javascript', 'mastodon', 'service_worker', 'entry.js'),
    }),
  ],
};

module.exports = merge({}, baseConfig, productionConfig);
