const path = require('path');
const {
    CheckerPlugin
} = require('awesome-typescript-loader');


module.exports = {
    entry: path.resolve('./src/index.tsx'),

    output: {
        path: path.resolve('./build'),
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
            }
        ]
    },
    plugins: [
        new CheckerPlugin()
    ]
};
