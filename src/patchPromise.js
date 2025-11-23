/* eslint-disable no-unused-vars */
// @ts-nocheck
'use strict';

const tracker = require('./tracker');
const { logger } = require('./utils/logger');

// Save originals
const OriginalPromise = global.Promise;
let isPatched = false;

// Save originals we will override so we can restore them later
const originalThen = OriginalPromise && OriginalPromise.prototype && OriginalPromise.prototype.then;
const originalResolve = OriginalPromise && OriginalPromise.resolve;
const originalReject = OriginalPromise && OriginalPromise.reject;
const originalAll = OriginalPromise && OriginalPromise.all;
const originalRace = OriginalPromise && OriginalPromise.race;
const originalAllSettled = OriginalPromise && OriginalPromise.allSettled;
const originalAny = OriginalPromise && OriginalPromise.any;

/**
 * Helper: safely track a promise if it's an object / thenable
 */
function safeTrack(p) {
  try {
    if (!p || (typeof p !== 'object' && typeof p !== 'function')) return p;

    // If it's already tracked (same object), tracker.trackPromise should be tolerant.
    tracker.trackPromise(p, new Error().stack);

    if (typeof p.finally === 'function') {
      p.finally(() => {
        try {
          tracker.untrack(p);
        } catch (e) {
          // ignore
        }
      });
    }
  } catch (e) {
    // ignore any tracking errors
  }
  return p;
}

/**
 * Patched constructor wrapper. We create a native promise via OriginalPromise and track it.
 * Note: we return the native promise instance, so instanceof checks still hold.
 */
function PatchedPromise(executor) {
  // if called without `new`, behave like a normal Promise call
  if (!(this instanceof PatchedPromise)) {
    // create and return a tracked promise
    const p = new OriginalPromise(executor);
    safeTrack(p);
    return p;
  }

  const promise = new OriginalPromise(executor);
  safeTrack(promise);
  return promise;
}

/**
 * Patch static methods to ensure returned promises are tracked.
 * We'll attach functions to PatchedPromise that call the original static function,
 * then track the returned promise (if any).
 */
function attachStatic(name, originalFn) {
  if (typeof originalFn !== 'function') return;
  PatchedPromise[name] = function (...args) {
    const result = originalFn.apply(OriginalPromise, args);
    // track returned promise/thenable
    return safeTrack(result);
  };
}

/**
 * In some environments (older Node versions) Promise.prototype.then can be non-configurable.
 * We'll override it by replacing OriginalPromise.prototype.then and remembering the original.
 */
function overrideThen() {
  if (typeof originalThen !== 'function') return;

  function patchedThen(onFulfilled, onRejected) {
    // call original then on this promise (this could be a thenable too)
    const result = originalThen.call(this, onFulfilled, onRejected);
    // Track the newly returned promise from then()
    safeTrack(result);
    return result;
  }

  try {
    // Override the prototype's then (this affects all promises)
    OriginalPromise.prototype.then = patchedThen;
  } catch (e) {
    // Some environments may not allow changing prototype; ignore in that case
    logger.warn('Could not patch Promise.prototype.then — some thenables may not be tracked.');
  }
}

function restoreThen() {
  try {
    if (typeof originalThen === 'function') {
      OriginalPromise.prototype.then = originalThen;
    }
  } catch (e) {
    // ignore
  }
}

function apply() {
  if (isPatched) return;
  // Attach static wrappers
  attachStatic('resolve', originalResolve);
  attachStatic('reject', originalReject);
  attachStatic('all', originalAll);
  attachStatic('race', originalRace);
  attachStatic('allSettled', originalAllSettled);
  attachStatic('any', originalAny);

  // Set prototype so instanceof checks referencing PatchedPromise still work in many cases.
  PatchedPromise.prototype = OriginalPromise.prototype;

  // Replace global Promise with our wrapper
  global.Promise = PatchedPromise;

  // Override then on original prototype so the returned promises from .then are tracked
  overrideThen();

  isPatched = true;
  logger.info('Promise patching enabled (tracking thenables and .then chains)');
}

function restore() {
  if (!isPatched) return;
  try {
    // Restore global Promise
    global.Promise = OriginalPromise;

    // Restore prototype then
    restoreThen();

    // Remove any static properties we added on PatchedPromise to avoid leaking memory (non-critical)
    try {
      delete PatchedPromise.resolve;
      delete PatchedPromise.reject;
      delete PatchedPromise.all;
      delete PatchedPromise.race;
      delete PatchedPromise.allSettled;
      delete PatchedPromise.any;
    } catch (e) {
      // ignore
    }

    // Clear tracker state
    try {
      if (tracker && typeof tracker.clear === 'function') tracker.clear();
    } catch (e) {
      // ignore
    }

    logger.info('Promise patching disabled');
  } catch (e) {
    // ignore restore errors
  } finally {
    isPatched = false;
  }
}

// expose helper for tests
function _restoreAndClear() {
  restore();
  try {
    if (tracker && typeof tracker.clear === 'function') tracker.clear();
  } catch (e) {
    // ignore
  }
}

module.exports = { apply, restore, _restoreAndClear };
