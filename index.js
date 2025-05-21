// Re-export the main module for use as a library
module.exports = require('./src/index.js');

// If this file is being executed directly, run the server
if (require.main === module) {
  require('./server.js');
}
