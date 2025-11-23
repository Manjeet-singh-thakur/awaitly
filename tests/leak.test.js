const assert = require('assert');
const awaitLeakDetector = require('../src');

describe('Promise Leak Detection', () => {
  beforeEach(() => {
    awaitLeakDetector.enable();
  });

  afterEach(() => {
    awaitLeakDetector.disable();
  });

  it('should track unhandled promises', async () => {
    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    // create a promise that never resolves
    const p = new Promise(() => {});

    // wait a tick to allow tracker to register
    await delay(10);

    const count = awaitLeakDetector.tracker.getPendingCount();
    assert.ok(count >= 1, `expected at least 1 pending promise, got ${count}`);
  });

  it('should not report properly awaited promises', async () => {
    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    const p = new Promise(resolve => setTimeout(() => resolve(42), 5));
    const val = await p;
    assert.strictEqual(val, 42);

    // give finally handlers a moment to run
    await delay(10);

    const count = awaitLeakDetector.tracker.getPendingCount();
    assert.strictEqual(count, 0, `expected 0 pending promises, got ${count}`);
  });
});