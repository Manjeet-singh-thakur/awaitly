const assert = require('assert');
const awaitLeakDetector = require('../src');
const { tracker } = awaitLeakDetector;

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

describe('Safe Await Usage', () => {
  beforeEach(() => {
    awaitLeakDetector.enable();
  });

  afterEach(() => {
    awaitLeakDetector.disable();
    if (tracker.clear) tracker.clear();
  });

  it('should handle async/await correctly', async () => {
    async function foo() {
      return 7;
    }

    const v = await foo();
    assert.strictEqual(v, 7);

    await delay(10); // allow cleanup

    assert.strictEqual(tracker.getPendingCount(), 0);
  });

  it('should work correctly with Promise chains', async () => {
    const p = Promise.resolve(1)
      .then(v => v + 1)
      .then(v => v + 1);

    const v = await p;
    assert.strictEqual(v, 3);

    await delay(10);

    assert.strictEqual(tracker.getPendingCount(), 0);
  });
});
