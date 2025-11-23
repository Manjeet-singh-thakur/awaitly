'use strict';

const patchPromise = require('./patchPromise');
const tracker = require('./tracker');

let isEnabled = false;

/**
 * enable detector
 * - can be called with a number (timeoutMs) or an options object { timeoutMs, intervalMs }
 */
function enable(options) {
  if (!isEnabled) {
    let timeoutMs = 5000;
    let intervalMs = 1000;
    if (typeof options === 'number') {
      timeoutMs = options;
    } else if (options && typeof options === 'object') {
      if (typeof options.timeoutMs === 'number') timeoutMs = options.timeoutMs;
      if (typeof options.intervalMs === 'number') intervalMs = options.intervalMs;
    }

    patchPromise.apply();
    try {
      if (tracker && typeof tracker.startAutoCheck === 'function') {
        tracker.startAutoCheck(timeoutMs, intervalMs);
      }
    } catch (e) {
      // ignore
    }

    isEnabled = true;
  }
}

function disable() {
  if (isEnabled) {
    try {
      if (tracker && typeof tracker.stopAutoCheck === 'function') tracker.stopAutoCheck();
    } catch (e) {
      // ignore
    }
    patchPromise.restore();
    isEnabled = false;
  }
}

module.exports = {
  enable,
  disable,
  tracker
};