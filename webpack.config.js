const path = require('path');
const {
    CheckerPlugin
} = require('awesome-typescript-loader');


module.exports = {
    entry: path.resolve('./src/App.tsx'),

    output: {
        path: path.resolve('./build'),
        filename: 'bundle.js'
    },

    resolve: {
        extensions: [
            '.js',
            '.ts',
            '.tsx'
        ]
    },

    devtool: 'source-map',

    module: {
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
