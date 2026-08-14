// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'typescript') {
    return originalRequire.call(this, '@typescript/typescript6');
  }
  return originalRequire.call(this, id);
};
