const { log } = require('./index.js')
const { randomUUID } = require('node:crypto')


module.exports = function(RED) {
  function LogToFileNode(config) {
    RED.nodes.createNode(this, config)
    let node = this
    const configNode = RED.nodes.getNode(config.dir)
    node.id = randomUUID()
    configNode.addInputNode(node)
    node.on('input', msg => configNode.input(msg, error => error ? node.error(error) : null));
    node.on('close', () => configNode.rmInputNode(id))
  }
  RED.nodes.registerType("log-to-file", LogToFileNode);
}
