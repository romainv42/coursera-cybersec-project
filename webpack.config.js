const path = require("path")
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: "./front-src/script/app.js",
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'script/app.bundle.js'
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: './front-src/index.html', to: './' },
                { from: './front-src/css', to: './css' },
            ],
        }),
    ],
}