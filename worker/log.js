module.exports = log;
module.exports.workerId = -1;

function log () {
  var args = Array.prototype.slice.call(arguments);
  var tags = args.length > 1 ? [args.shift()] : [];
  tags.unshift('Worker ' + module.exports.workerId);
  if (typeof process.send === 'function') {
    process.send({
      tags: tags,
      message: args,
      workerId: module.exports.workerId
    });
  } else {
    console.log.apply(console, [tags].concat(args));
  }
}
