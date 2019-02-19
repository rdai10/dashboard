const Dotenv = require('dotenv-webpack')

module.exports = {
  target: 'serverless',
  webpack: (config) => {
    config.plugins.push(
      new Dotenv({ path: './.env' })
    )
    return config
  }
}
