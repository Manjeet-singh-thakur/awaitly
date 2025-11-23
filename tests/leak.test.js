const assert = require('assert');
const awaitLeakDetector = require('../src');
const { tracker } = awaitLeakDetector;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Promise Leak Detection', () => {
  beforeEach(() => {
    awaitLeakDetector.enable();
  });

  afterEach(() => {
    // full clean reset (restores Promise + clears trackers)
    awaitLeakDetector.disable();
    if (tracker.clear) tracker.clear();
  });

  it('should track unhandled (floating) promises', async () => {
    // floating promise – never awaited, never resolved
    new Promise(() => {});

    await delay(20); // wait for tracker to register

    const count = tracker.getPendingCount();
    assert.ok(
      count >= 1,
      `expected at least 1 pending promise, got ${count}`
    );
  });

  it('should not report awaited / properly resolved promises', async () => {
    const val = await new Promise(resolve => setTimeout(() => resolve(42), 5));
    assert.strictEqual(val, 42);

    await delay(20); // allow finally to untrack

    const count = tracker.getPendingCount();
    assert.strictEqual(count, 0, `expected 0 pending promises, got ${count}`);
  });
});
