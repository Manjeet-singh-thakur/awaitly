/* eslint-disable no-unused-vars */
// @ts-nocheck
'use strict';

const tracker = require('./tracker');
const { logger } = require('./utils/logger');

const OriginalPromise = global.Promise;
let isPatched = false;

// Save originals
const originalThen = OriginalPromise.prototype.then;
const originalCatch = OriginalPromise.prototype.catch;
const originalFinally = OriginalPromise.prototype.finally;

const originalStatic = {
  resolve: OriginalPromise.resolve,
  reject: OriginalPromise.reject,
  all: OriginalPromise.all,
  race: OriginalPromise.race,
  allSettled: OriginalPromise.allSettled,
  any: OriginalPromise.any,
};

function safeTrack(promise) {
  if (!promise || typeof promise !== 'object') return promise;
  if (tracker.isTracked && tracker.isTracked(promise)) return promise;

  const stack = new Error().stack;
  tracker.trackPromise(promise, stack);

  // Correct way: use .then() to detect settlement (fulfilled or rejected)
  promise.then(
    () => tracker.untrack(promise),
    () => tracker.untrack(promise)
  ).catch(() => {
    // Ignore errors in the tracking chain itself
    // Prevents unhandled rejection warnings from our own detector
  });

  return promise;
}

// Patched Promise constructor
function PatchedPromise(executor) {
  if (!(this instanceof PatchedPromise)) {
    return safeTrack(new OriginalPromise(executor));
  }

  const promise = new OriginalPromise(executor);
  Object.setPrototypeOf(promise, PatchedPromise.prototype);
  return safeTrack(promise);
}

// Patch static methods
Object.keys(originalStatic).forEach(key => {
  const original = originalStatic[key];
  PatchedPromise[key] = function (...args) {
    return safeTrack(original.apply(OriginalPromise, args));
  };
});

function patchPrototype() {
  OriginalPromise.prototype.then = function (onFulfilled, onRejected) {
    const result = originalThen.call(this, onFulfilled, onRejected);
    return safeTrack(result);
  };

  OriginalPromise.prototype.catch = function (onRejected) {
    const result = originalCatch.call(this, onRejected);
    return safeTrack(result);
  };

  OriginalPromise.prototype.finally = function (onFinally) {
    const result = originalFinally.call(this, onFinally);
    return safeTrack(result);
  };
}

function restorePrototype() {
  OriginalPromise.prototype.then = originalThen;
  OriginalPromise.prototype.catch = originalCatch;
  OriginalPromise.prototype.finally = originalFinally;
}

function apply() {
  if (isPatched) return;

  patchPrototype();

  // Make PatchedPromise inherit from OriginalPromise properly
  PatchedPromise.prototype = Object.create(OriginalPromise.prototype);
  PatchedPromise.prototype.constructor = PatchedPromise;

  // Copy statics
  Object.assign(PatchedPromise, originalStatic);

  global.Promise = PatchedPromise;
  isPatched = true;

  logger.info('Promise tracking enabled - detecting await leaks');
}

function restore() {
  if (!isPatched) return;

  restorePrototype();
  global.Promise = OriginalPromise;
  isPatched = false;

  try { tracker.clear(); } catch (e) {}

  logger.info('Promise tracking disabled');
}

function _restoreAndClear() {
  restore();
  try { tracker.clear(); } catch (e) {}
}

module.exports = { apply, restore, _restoreAndClear };