const masterDirectoryList = require('../../directories/master-directory-list.json')
const directoryList = require('../../directories/directory-list.json')
const completeList = require('../../directories/directorybolt-complete.json')

const registry = {
  master: masterDirectoryList,
  simple: directoryList,
  complete: completeList,
}

module.exports = registry
