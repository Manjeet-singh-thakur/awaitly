/* eslint-disable no-unused-vars */
// @ts-nocheck
'use strict';

const tracker = require('./tracker');
const { logger } = require('./utils/logger');

const originalPromise = global.Promise;
let isPatched = false;

function patchedPromise(executor) {
  const promise = new originalPromise(executor);
  tracker.trackPromise(promise, new Error().stack);
  // remove from tracking when settled
  if (typeof promise.finally === 'function') {
    promise.finally(() => {
      try {
        tracker.untrack(promise);
      } catch (e) {
        // ignore
      }
    });
  }
  return promise;
}

function copyStaticMethods() {
  const staticProps = ['resolve', 'reject', 'all', 'race', 'allSettled', 'any'];
  for (const prop of staticProps) {
    if (typeof originalPromise[prop] === 'function') {
      patchedPromise[prop] = function(...args) {
        return originalPromise[prop](...args);
      };
    }
  }
}

function apply() {
  if (!isPatched) {
    copyStaticMethods();
    patchedPromise.prototype = originalPromise.prototype;
    global.Promise = patchedPromise;
    isPatched = true;
    logger.info('Promise patching enabled');
  }
}

function restore() {
  if (isPatched) {
    global.Promise = originalPromise;
    isPatched = false;
    try {
      if (tracker && typeof tracker.clear === 'function') tracker.clear();
    } catch (e) {
      // ignore
    }
    logger.info('Promise patching disabled');
  }
}
// expose a helper for tests to clear state when restoring
function _restoreAndClear() {
  restore();
  try {
    if (tracker && typeof tracker.clear === 'function') tracker.clear();
  } catch (e) {
    // ignore
  }
}

module.exports = { apply, restore };