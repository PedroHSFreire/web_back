const backend = require('../index.js');

if (require.main === module && backend && typeof backend.start === 'function') {
  backend.start();
}

module.exports = backend;
module.exports.default = backend.default || backend;
