const assert = require('assert');
const awaitLeakDetector = require('../src');

describe('Safe Await Usage', () => {
  beforeEach(() => {
    awaitLeakDetector.enable();
  });

  afterEach(() => {
    awaitLeakDetector.disable();
  });

  it('should handle async/await correctly', async () => {
    async function foo() { return 7; }
    const v = await foo();
    assert.strictEqual(v, 7);

    // small delay to allow tracker cleanup
    await new Promise(r => setTimeout(r, 5));
    assert.strictEqual(awaitLeakDetector.tracker.getPendingCount(), 0);
  });

  it('should work with Promise chains', async () => {
    const p = Promise.resolve(1).then(v => v + 1).then(v => v + 1);
    const val = await p;
    assert.strictEqual(val, 3);
    await new Promise(r => setTimeout(r, 5));
    assert.strictEqual(awaitLeakDetector.tracker.getPendingCount(), 0);
  });
});