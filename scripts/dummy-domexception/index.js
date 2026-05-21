// Use native DOMException on modern Node.js and browser platforms.
if (!globalThis.DOMException) {
  try {
    const { DOMException } = require('node:buffer');
    globalThis.DOMException = DOMException;
  } catch (e) {
    // Fallback if needed
  }
}
module.exports = globalThis.DOMException;
