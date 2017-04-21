/* eslint-disable */
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './example/index.js',
  output: {
    filename: 'bundle.min.js',
    path: path.resolve(__dirname, 'example/js'),
    publicPath: '/js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ],
  devtool: 'source-map'
};
