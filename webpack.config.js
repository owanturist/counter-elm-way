const path = require('path');
const {
    CheckerPlugin
} = require('awesome-typescript-loader');
const WebpackHTMLPlugin = require('webpack-html-plugin');


module.exports = {
    entry: path.resolve('./src/client.tsx'),

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

    devtool: 'source-map',

    module: {
        noParse: [
            /react\.min.js/
        ],
        loaders: [
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

        new WebpackHTMLPlugin({
            inject: true,
            template: path.resolve('./src/index.html')
        })
    ]
};
