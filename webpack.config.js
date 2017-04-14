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

    // Currently we need to add '.ts' to the resolve.extensions array.
    resolve: {
        extensions: [
            '.js',
            '.ts',
            '.tsx'
        ]
    },

    // Source maps support ('inline-source-map' also works)
    devtool: 'source-map',

    // Add the loader for .ts files.
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                use: [
                    'babel-loader',
                    'awesome-typescript-loader'
                ]
            }
        ]
    },
    plugins: [
        new CheckerPlugin()
    ]
};
