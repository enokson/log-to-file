const { existsSync, mkdir, open, rm, readdir, write } = require('node:fs')
const { join } = require('node:path')
const createDirIfNotExist = (dir, cb) => {
  if (!dir) {
    cb(new Error('createDirIfNotExist/Missing parameter: dir'))
    return
  }
  cb = cb || function() {}
  if (!existsSync(dir)) return mkdir(dir, { recursive: true }, cb)
  cb(null, null)
}
const openFile = (filePath, cb) => {
  if (!filePath) {
    cb(new Error('openFile()/Missing parameter: filePath'))
    return
  }
  cb = cb || function() {}
  console.log('openFile', filePath)
  open(filePath, 'a', cb)
}
module.exports.openFile = openFile
const getFileName = (dir, date) => {
  if (!dir) {
    cb(new Error('getFileName/Missing parameter: dir'), null)
    return
  }
  if (!date) {
    cb(new Error('getFileName/Missing parameter: date'), null)
    return
  }
  const dateStr = date.toISOString().split('T')[0];
  return join(dir, `${dateStr}.log`);
}
const deleteOldFiles = async (dir, maxFileCount, cb) => {
  if (!dir) {
    cb(new Error('deleteOldFiles/Missing parameter: dir'))
    return
  }
  if (!maxFileCount) {
    cb(new Error('deleteOldFiles/Missing parameter: maxFileCount'))
    return
  }
  cb = cb || function() {}
  readdir(dir, (error, files) => {
    if (error) return cb(error)
    if (files.length > maxFileCount) {
      const filesToDelete = files.slice(0, files.length - maxFileCount);
      for (const file of filesToDelete) {
        let rmError = null
        rm(join(dir, file), error => error ? rmError = error : null)
        if (rmError) return cb('/deletOldFiles/readir/rm/' + rmError)
      }
    }
    cb(null)
  })
}
module.exports.checkForDateChange = (date, dir, maxFileCount, cb) => {
  if (!dir) {
    cb(new Error('checkForDateChange/Missing parameter: dir'), null)
    return
  }
  if (!maxFileCount) {
    cb(new Error('checkForDateChange/Missing parameter: maxFileCount'), null)
    return
  }
  cb = cb || function() {}
  const newDate = new Date();
  if (date.getDate() === newDate.getDate()) return cb(null, null)
  deleteOldFiles(dir, maxFileCount, error => error ? cb(error, null) : cb(null, newDate));
}
module.exports.init = (dir, maxFileCount, cb) => {
  if (!dir) {
    cb(new Error('init/Missing parameter: dir'), null)
    return
  }
  if (!maxFileCount) {
    cb(new Error('init/Missing parameter: maxFileCount'), null)
    return
  }
  cb = cb || function() {}
  createDirIfNotExist(dir, error => {
    if (error) return cb(error, null)
    deleteOldFiles(dir, maxFileCount, error => {
      if (error) return cb(error, null)
      const date = new Date()
      openFile(getFileName(dir, date), cb)
    })
  })
}
module.exports.log = (logFile, msg, cb) => {
  const date = new Date()
  const dateStr = date.toISOString()
  write(logFile, dateStr + " " + msg + '\n', cb)
}