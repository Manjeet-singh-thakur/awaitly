# awaitly

`awaitly` is a lightweight, developer-focused utility to help detect un-awaited Promises (potential async "leaks") during development and testing. It instruments `global.Promise` to track created Promises, warns when promises remain pending longer than a configurable timeout, and provides a small API for inspection during tests.

This README explains how to use `awaitly` in Node.js and in browser/react builds, how to configure the timeout behavior, how to run tests, and how to publish the package to npm.

---

## Install

Install from npm (when published):

```bash
npm install await-leak-detector
```

During local development you can install from a local path or use `npm link`.

## Quick Node.js example

```js
// example/node-demo.js
const awaitLeak = require('await-leak-detector');

// Enable with defaults (timeout 5000ms, interval 1000ms)
awaitLeak.enable();

// Or enable with a custom timeout (ms) or options object
// awaitLeak.enable(2000);
// awaitLeak.enable({ timeoutMs: 2000, intervalMs: 1000 });

// Example: create a promise that never resolves
new Promise(() => {});

// The detector will log a warning after the configured timeout.

// When done (or in tests cleanup):
// awaitLeak.disable();
```

Run with node:

```bash
node example/node-demo.js
```

## Using in a React (browser) app

Important: `awaitly` instruments `global.Promise`. That is invasive and may interact with other libraries. Use it only in development builds or behind feature flags.

Example (React, enable in development only):

```js
// src/setupAwaitly.js
import awaitLeak from 'await-leak-detector';

if (process.env.NODE_ENV === 'development') {
  // start with a 2s timeout and 500ms check intervals
  awaitLeak.enable({ timeoutMs: 2000, intervalMs: 500 });
}
```

Then import `src/setupAwaitly.js` at your application entry point (e.g. `index.js`) so it runs early.

Caveats for browser/react
- Bundlers may modify how `global` works; generally `global.Promise` maps to `window.Promise` in browsers. The package tries to preserve common Promise static helpers (`resolve`, `all`, etc.) but you should test your app.
- Prefer enabling only during development to avoid performance overhead and behavioral changes in production.

## API

- `enable()`
  - `enable()` — enable with defaults: `timeoutMs = 5000`, `intervalMs = 1000`.
  - `enable(timeoutMs)` — pass a number (ms) to set timeout.
  - `enable({ timeoutMs, intervalMs })` — pass options object.

- `disable()` — stop auto-checks (if running) and restore `global.Promise` to the original implementation. Also clears internal state.

- `tracker` — diagnostic API exported by the module. Useful in tests only.
  - `tracker.getPendingCount()` — number of promises considered pending by the tracker.
  - `tracker.getPendingTraces()` — array of stack traces for pending promises.
  - `tracker.clear()` — clear tracked state (useful in tests to reset between runs).

Notes:
- In `NODE_ENV === 'test'`, `awaitly` uses a `Map`-based internal store so tests can inspect counts/traces. In other environments it uses a `WeakMap` to avoid holding strong references to Promise objects.
- The detector attaches a `finally` handler to each created Promise so it can `untrack` the promise once it settles. This means `awaitly` expects Promises to run their `finally` logic when settled, which is the usual Promise behaviour.

## Example tests (mocha)

```js
const assert = require('assert');
const awaitLeak = require('await-leak-detector');

describe('await-leak basics', function() {
  beforeEach(function() { awaitLeak.enable(); });
  afterEach(function() { awaitLeak.disable(); });

  it('detects a never-resolving promise', async function() {
    new Promise(() => {});
    // small delay to allow registration
    await new Promise(r => setTimeout(r, 10));
    assert(awaitLeak.tracker.getPendingCount() >= 1);
  });
});
```

## Publishing to npm

1. Ensure `package.json` is correctly filled out (name, version, description, repository, license, keywords).
2. Add a `.npmignore` to exclude tests and local files you don't want shipped.
3. Login to npm (if not already):

```bash
npm login
```

4. Run the publish command from the package root:

```bash
npm publish --access public
```

If you plan to publish scoped packages (e.g., `@your-org/await-leak-detector`), set `--access public` for public scoped packages.

## Recommendations & best practices

- Enable `awaitly` only during development and testing. Overriding `global.Promise` is invasive and can interact with other libraries.
- Prefer the default WeakMap-backed mode in production builds so the detector does not retain strong references to Promise objects.
- If you need lower overhead, enable stack capture only conditionally (for example, when `process.env.DEBUG` is set) — stack capture on every Promise creation has runtime cost.
- Provide an opt-out list in your app if some long-running Promises are expected (e.g., background tasks).

## Troubleshooting

- If other libraries or your app rely on custom Promise subclasses or special static methods, test thoroughly. The library copies common static functions but may not perfectly emulate all edge cases.
- If you see false positives, increase the `timeoutMs` value or mark expected long-running promises so they're not considered leaks.

## License

MIT
