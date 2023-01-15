const path = require('path');

module.exports = {
  entry: './Tableturf.ts',
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'api.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'api',
    libraryTarget: 'commonjs',
  },
};