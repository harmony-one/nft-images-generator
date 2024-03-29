'use strict'

const fs = require('fs')
const path = require('path')

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

const NODE_ENV = process.env.NODE_ENV || 'testnet'

if (!process.env.NODE_ENV) {
  console.warn('NODE ENV is not specified. Set to production')
}

const dotenvFiles = [
  `${resolveApp('.env')}`,
  `${resolveApp('.env')}.example`,
].filter(Boolean)

console.log('dotenvFiles', dotenvFiles)

dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile,
      })
    )
  }
})
