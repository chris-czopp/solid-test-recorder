/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const version = require('../buildStamp')
const entryPointsPath = path.resolve(__dirname, '../src/entryPoints')
const entryPoints = fs.readdirSync(entryPointsPath).reduce(
  (acc, pageDirName) => [
    ...acc,
    ...(fs.lstatSync(`${entryPointsPath}/${pageDirName}`).isDirectory()
      ? [
          {
            ...require(path.resolve(__dirname, `../src/entryPoints/${pageDirName}/settings.js`)),
            bundleName: pageDirName
          }
        ]
      : [])
  ],
  []
)

module.exports = {
  target: 'web',
  entry: entryPoints.reduce(
    (acc, { bundleName }) => ({
      ...acc,
      [bundleName]: path.resolve(__dirname, `../src/entryPoints/${bundleName}/index.js`)
    }),
    {}
  ),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [path.resolve(__dirname, '../src'), path.resolve(__dirname, '../node_modules/@gluecodes')],
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, '../babel.config.js')
          }
        },
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'global.ENV': JSON.stringify(process.env.NODE_ENV),
      'global.LOCATION_ORIGIN': JSON.stringify(process.env.LOCATION_ORIGIN)
    }),
    ...entryPoints.map(
      (entryPoint) =>
        new HtmlWebpackPlugin({
          chunks: [],
          inject: false,
          template: path.resolve(__dirname, `../src/pageTemplates/${entryPoint.template}/index.ejs`),
          templateParameters: (compilation) => {
            const componentStyleChunk = Array.from(compilation.chunks).find((chunk) => chunk.name === 'componentStyles')
            const componentStyleJsFileName =
              componentStyleChunk && componentStyleChunk.files.find((fileName) => /\.js$/.test(fileName))

            return {
              ...entryPoint,
              bundleName: entryPoint.bundleName,
              bundles: {
                js: {
                  componentStyles:
                    componentStyleJsFileName &&
                    `/bundles/${componentStyleJsFileName.replace(/-[A-Z]+\.chunk\.js$/, '.chunk.js')}`,
                  main: `/bundles/${entryPoint.bundleName}-${version}.js`
                }
              },
              env: process.env.NODE_ENV
            }
          }
        })
    ),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../src/extension/documentEnd.js'),
          to: path.resolve(__dirname, '../dist/documentEnd.js')
        },
        {
          from: path.resolve(__dirname, '../src/extension/documentStart.js'),
          to: path.resolve(__dirname, '../dist/documentStart.js')
        },
        {
          from: path.resolve(__dirname, '../src/extension/devtools.js'),
          to: path.resolve(__dirname, '../dist/devtools.js')
        },
        {
          from: path.resolve(__dirname, '../src/extension/devtools_page.html'),
          to: path.resolve(__dirname, '../dist/devtools_page.html')
        },
        {
          from: path.resolve(__dirname, '../src/extension/manifest.json'),
          to: path.resolve(__dirname, '../dist/manifest.json')
        },
        {
          from: path.resolve(__dirname, '../src/extension/objectReloader.js'),
          to: path.resolve(__dirname, '../dist/objectReloader.js')
        },
        {
          from: path.resolve(__dirname, '../node_modules/monaco-editor/min'),
          to: path.resolve(__dirname, '../dist/monaco-editor/min')
        }
      ]
    }),
    new webpack.ProvidePlugin({
      process: 'process'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.ContextReplacementPlugin(/eslint\/lib\/linter/, (data) => {
      data.dependencies.forEach((dependency) => {
        delete dependency.critical
      })

      return data
    }),
    ...(process.env.NODE_ENV === 'production'
      ? [
          {
            apply: (compiler) => {
              compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                const manifestPath = path.resolve(__dirname, '../dist/manifest.json')
                const manifestFile = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

                manifestFile.web_accessible_resources[0].resources = [
                  ...manifestFile.web_accessible_resources[0].resources,
                  ...compilation
                    .getAssets()
                    .filter(({ name }) => /^monaco-editor\/min/.test(name))
                    .map(({ name }) => name)
                ]

                fs.writeFileSync(manifestPath, JSON.stringify(manifestFile, undefined, 2))
              })
            }
          }
        ]
      : [])
  ],
  output: {
    filename: `bundles/[name]-${version}.js`,
    chunkFilename: `bundles/[name]-[chunkhash]-${version}.chunk.js`,
    path: path.resolve(__dirname, '../dist/'),
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true
  },
  devServer: {
    host: '0.0.0.0',
    port: process.env.PORT,
    static: {
      directory: path.resolve(__dirname, '../dist/')
    },
    hot: true
  },
  watchOptions: {
    aggregateTimeout: 1000,
    poll: 3000
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.mjs'],
    preferRelative: false,
    alias: {
      ESLinter$: path.resolve(__dirname, '../node_modules/eslint/lib/linter/linter.js'),
      esquery: path.resolve(__dirname, 'esqueryFix.js')
    },
    fallback: {
      assert: require.resolve('assert'),
      path: require.resolve('path-browserify'),
      util: require.resolve('util')
    }
  },
  devtool: 'source-map'
}
