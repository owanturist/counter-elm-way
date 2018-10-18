const path = require('path');
const webpack = require('webpack');
const {
    CheckerPlugin
} = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = env => ({
    entry: path.resolve('./src/index.tsx'),

    output: {
        path: path.resolve('./build'),
        publicPath: '/',
        filename: 'bundle.js'
    },

    resolve: {
        extensions: [
            '.js',
            '.ts',
            '.tsx'
        ],
        modules: [
            path.resolve('./src'),
            path.resolve('./node_modules')
        ]
    },

    module: {
        noParse: [
            /react\.min.js/
        ],
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                            localIdentName: '[folder]__[local]--[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'typed-css-modules-loader'
                    },
                    {
                        loader: 'postcss-loader'
                    }
                ]
            }
        ]
    },

    plugins: [
        new CheckerPlugin(),

        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve('./src/index.html')
        }),

        new webpack.DefinePlugin({
            OPENEXCHANGERATES_APP_ID: JSON.stringify(env.OPENEXCHANGERATES_APP_ID)
        })
    ],

    devtool: 'source-map',

    mode: 'development'
});
