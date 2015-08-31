module.exports = log;
module.exports.workerId = -1;

function log () {
  var args = Array.prototype.slice.call(arguments);
  var tags = args.length > 1 ? [args.shift()] : [];
  if (typeof process.send === 'function') {
    // hack to allow error info to get passed back to main thread
    args = args.map(function (a) {
      if (a instanceof Error) {
        return { message: a.message, stack: a.stack };
      } else {
        return a;
      }
    });
    process.send({
      tags: tags,
      message: args,
      workerId: module.exports.workerId
    });
  } else {
    tags.unshift('Worker ' + module.exports.workerId);
    console.log.apply(console, [tags].concat(args));
  }
}
