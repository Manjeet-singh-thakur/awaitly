// @ts-nocheck
'use strict';

const { logger } = require('./utils/logger');
const { parseStack } = require('./utils/stackParser');

class PromiseTracker {
  constructor() {
    this._isTest = process.env.NODE_ENV === 'test';

    // primary storage: Map in test (inspectable), WeakMap in other envs (avoids strong refs)
    this._primary = this._isTest ? new Map() : new WeakMap();

    // index is a Map of id -> meta so we can iterate / count pending promises
    this._index = new Map();
    this._idCounter = 0;

    this._checkInterval = null;
  }

  trackPromise(promise, stack) {
    const trace = parseStack(stack);
    const id = ++this._idCounter;
    const meta = {
      id,
      createdAt: Date.now(),
      trace
    };

    try {
      this._primary.set(promise, meta);
    } catch (e) {
      // some environments may not allow using WeakMap.set in certain ways — ignore
    }
    this._index.set(id, meta);
  }

  untrack(promise) {
    try {
      const meta = this._primary.get(promise);
      if (meta && meta.id) {
        this._index.delete(meta.id);
      }
      if (typeof this._primary.delete === 'function') this._primary.delete(promise);
    } catch (e) {
      // ignore
    }
  }

  getPendingCount() {
    return this._index.size;
  }

  getPendingTraces() {
    const out = [];
    for (const meta of this._index.values()) {
      out.push(meta.trace);
    }
    return out;
  }

  clear() {
    // reset primary storage
    if (this._isTest && typeof this._primary.clear === 'function') {
      this._primary.clear();
    } else {
      this._primary = new WeakMap();
    }
    this._index.clear();
    this._idCounter = 0;
    this.stopAutoCheck();
  }

  checkLeaks(timeoutMs = 5000) {
    const now = Date.now();
    for (const meta of this._index.values()) {
      if (now - meta.createdAt > timeoutMs) {
        logger.warn(`Potential leak detected: Promise pending for ${now - meta.createdAt}ms`);
        logger.debug(meta.trace);
      }
    }
  }

  startAutoCheck(timeoutMs = 5000, intervalMs = 1000) {
    this.stopAutoCheck();
    this._checkInterval = setInterval(() => this.checkLeaks(timeoutMs), intervalMs);
  }

  stopAutoCheck() {
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
      this._checkInterval = null;
    }
  }
}

module.exports = new PromiseTracker();