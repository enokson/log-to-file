const { close } = require('fs')
const { init, checkForDateChange, openFile, log } = require('./index.js')
const refs = { }
module.exports = function(RED) {
  function LogToFileConfig(config) {
    RED.nodes.createNode(this, config);
    const node = this
    node.dir = config.dir
    node.maxFileCount = config.maxFileCount
    let ref
    if (!refs[node.dir]) {
      node.id = 0;
      refs[node.dir] = {
        count: 1, 
        logFile: null,
        openFileInterval: null,
        date: new Date(),
        nodes: [node],
        isReady: false
      }
      ref = refs[node.dir]
      ref.checkForDateChangeInterval = setInterval(() => {
        checkForDateChange(ref.date, node.dir, node.maxFileCount, (error, newDate) => {
          if (error) {
            for (const node of ref.nodes) {
              node.error(error)
              node.status({ fill: "red", shape: "ring", text: "error" })
            }
            ref.isReady = false
            return
          }
          if (newDate) {
            ref.date = newDate
            if (ref.logFile) {
              ref.logFile.close()
              openFile(getFileName(ref.date), (error, logFile) => {
                if (error) {
                  ref.isReady = false
                  for (const node of ref.nodes) { 
                    node.error(error)
                    node.status({ fill: "red", shape: "ring", text: "error" })
                  }
                  return
                }
                ref.logFile = logFile
                ref.isReady = true
                for (const node of ref.nodes) node.status({ fill: "green", shape: "dot", text: "ready" })                
              })
            }
          }
        })
      }, 1000)
      init(node.dir, node.maxFileCount, (error, logFile) => {
        if (error) {
          for (const node of ref.nodes) {
            node.error(error)
            node.status({ fill: "red", shape: "ring", text: "error" })
          }          
          ref.isReady = false
          ref.openFileInterval = setInterval(() => {
            init(ref.dir, ref.maxFileCount, (error, logFile) => {
              if (error) {
                for (const node of ref.nodes) node.error(error)
                return
              }
              ref.logFile = logFile
              ref.isReady = true
              for (const node of ref.nodes) node.status({ fill: "green", shape: "dot", text: "ready" })
              clearInterval(ref.openFileInterval)
            })
          }, 1000)
          return
        }
        ref.logFile = logFile
        ref.isReady = true
        for (const node of ref.nodes) node.status({ fill: "green", shape: "dot", text: "ready" })
      })
    } else {
      ref = refs[node.dir]
      ref.count++
      if (ref.maxFileCount) {
        if (ref.maxFileCount < node.maxFileCount) {
          ref.maxFileCount = node.maxFileCount
        }
      } else {
        ref.maxFileCount = node.maxFileCount
      }
    }
    for (const node of ref.nodes) {
      node.status({ fill: "red", shape: "ring", text: "initializing..." })
    }
    node.on('close', done => {
      if (ref.count === 1) {
        clearInterval(ref.openFileInterval)
        clearInterval(ref.checkForDateChangeInterval)
        if (!ref.logFile) return done()
        close(ref.logFile, error => {
          if (error) {
            for (const node of ref.nodes) node.error(error)
            return
          }
          for (const node of ref.nodes) node.status({ fill: "red", shape: "ring", text: "closed" })
          done()
        })
        delete refs[node.dir]
      } else {
        ref.count--
        done()
      }
    })
    node.rmInputNode = id => ref.nodes = ref.nodes.filter(n => n.id !== id)
    node.addInputNode = node => ref.nodes.push(node)
    node.input = (msg, cb) => {
      const ref = refs[node.dir]
      if (!ref || !ref.isReady) {
        for (const node of ref.nodes) node.error("Directory is not ready")
        return
      }
      log(ref.logFile, msg.payload, cb)
    }
  }  
  RED.nodes.registerType("log-to-file-config",LogToFileConfig);
}