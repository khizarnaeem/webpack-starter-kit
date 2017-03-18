/* eslint no-console: off */

import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import pkg from '../package.json';

const isDebug = process.env.NODE_ENV !== 'production';
const isVerbose = !!process.env.VERBOSE;
const isAnalyze = !!process.env.ANALYZE;

console.log(`
--------------------------------------------------
isDebug: ${isDebug}, isVerbose: ${isVerbose}, isAnalyze: ${isAnalyze}
--------------------------------------------------
`);

const NPM = path.join(__dirname, '../node_modules');
const APP = path.join(__dirname, '../src/js');

const config = {

    // Compile for usage in a browser-like environment
    // https://webpack.js.org/configuration/target/
    target: 'web',

    // An absolute path, for resolving entry points and loaders from configuration
    // https://webpack.js.org/configuration/entry-context/
    context: path.resolve(__dirname, '..'),

    // https://webpack.js.org/configuration/entry-context/#entry
    entry: {
        bundle: ['babel-polyfill', './src/js/bundle.js'],
    },

    // How and where it should output our bundles
    // https://webpack.js.org/configuration/output/
    output: {
        path: path.resolve(__dirname, '../dist/bundles'),
        pathinfo: isVerbose,
        filename: '[name].js?[hash]',
    },

    module: {
        rules: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            include: [
                path.resolve(__dirname, '../src'),
            ],
            query: {
                // https://github.com/babel/babel-loader#options
                cacheDirectory: isDebug,

                // https://babeljs.io/docs/usage/options/
                babelrc: false,
                presets: [
                    // A Babel preset that can automatically determine the Babel plugins and polyfills
                    // https://github.com/babel/babel-preset-env
                    ['env', {
                        targets: {
                            browsers: pkg.browserslist,
                        },
                        modules: isDebug ? 'commonjs' : false,
                        useBuiltIns: false,
                        debug: false,
                    }],
                    // Experimental ECMAScript proposals
                    // https://babeljs.io/docs/plugins/#presets-stage-x-experimental-presets-
                    'stage-2',
                    // JSX, Flow
                    // https://github.com/babel/babel/tree/master/packages/babel-preset-react
                    'react',
                    // Optimize React code for the production build
                    // https://github.com/thejameskyle/babel-react-optimize
                    ...isDebug ? [] : ['react-optimize'],
                ],
                plugins: [],
            },
        }, {
            test: /\.(css|less)$/,
            use: ExtractTextPlugin.extract({
                use: [{
                    loader: 'css-loader',
                    options: {
                        // CSS Loader https://github.com/webpack/css-loader
                        importLoaders: 2,
                        sourceMap: isDebug,
                        // CSS Nano http://cssnano.co/options/
                        minimize: /* !isDebug */ false,
                    },
                }, {
                    // PostCSS Loader https://github.com/postcss/postcss-loader
                    loader: 'postcss-loader',
                    options: { config: './tools/postcss.config.js' },
                }, {
                    // Less Loader https://github.com/webpack-contrib/less-loader
                    loader: 'less-loader',
                    options: { sourceMap: isDebug },
                }],
            }),
        }, {
            test: /\.modernizrrc(\.json)?$/,
            use: [{
                loader: 'modernizr-loader',
            }, {
                loader: 'json-loader',
            }],
        }],
    },

    // Don't attempt to continue if there are any errors.
    // https://webpack.js.org/configuration/other-options/#bail
    bail: !isDebug,

    // Cache the generated webpack modules and chunks to improve build speed
    // https://webpack.js.org/configuration/other-options/#cache
    cache: isDebug,

    // Precise control of what bundle information gets displayed
    // https://webpack.js.org/configuration/stats/
    stats: isVerbose ? 'verbose' : 'minimal',

    plugins: [
        // Define free variables
        // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
            'process.env.BROWSER': true,
            __DEV__: isDebug,
        }),

        // Extract webpack css into its own bundle
        // https://webpack.js.org/plugins/extract-text-webpack-plugin/
        new ExtractTextPlugin({
            filename: '[name].css',
            allChunks: true,
        }),

        ...isDebug ? [] : [
            // Minimize all JavaScript output of chunks
            // https://github.com/mishoo/UglifyJS2#compressor-options
            new webpack.optimize.UglifyJsPlugin({
                sourceMap: true,
                compress: {
                    screw_ie8: true, // React doesn't support IE8
                    warnings: isVerbose,
                    unused: true,
                    dead_code: true,
                    drop_console: true,
                },
                mangle: {
                    screw_ie8: true,
                },
                output: {
                    comments: false,
                    screw_ie8: true,
                },
            }),
        ],

        // Webpack Bundle Analyzer
        // https://github.com/th0r/webpack-bundle-analyzer
        ...isAnalyze ? [new BundleAnalyzerPlugin()] : [],
    ],

    // http://webpack.github.io/docs/configuration.html#devtool
    devtool: isDebug ? 'cheap-module-source-map' : false,

    // https://webpack.js.org/configuration/resolve/
    resolve: {
        modules: [APP, NPM],
        extensions: ['.js', '.jsx'],
        alias: {
            vendor: path.resolve(__dirname, NPM),
        },
    },

    // https://webpack.github.io/docs/configuration.html#node
    // https://github.com/webpack/node-libs-browser/tree/master/mock
    node: {
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
    },
};

export default config;
