module.exports = (api) => {
  api.cache(true)

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 2 versions', 'edge >= 16']
        },
        shippedProposals: true
      }
    ],
    ['@babel/preset-typescript']
  ]

  const plugins = [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-export-namespace-from'
  ]

  return {
    presets,
    plugins
  }
}
