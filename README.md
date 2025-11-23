

# **awaitly**

`awaitly` (npm: **`await-leak-detector`**) is a small development-time utility that helps you catch **un-awaited Promises** — a common cause of hidden async leaks, hanging tests, and “nothing happens but no error” bugs.

It works by temporarily instrumenting `global.Promise`, tracking newly created Promises, and warning you when a promise stays pending beyond a configured timeout.

> ⚠️ **Use only in development/test environments.**
> This package overrides the global `Promise` constructor, which can affect other libraries.
> Never enable it in production builds.

---

## 🚀 Installation

```bash
npm install await-leak-detector
```

---

## 🟦 Quick Example (Node.js)

```js
// example/node-demo.js
const awaitLeak = require("await-leak-detector");

// Start tracking (defaults: timeout 5000ms, interval 1000ms)
awaitLeak.enable();

// Create an un-awaited Promise (simulated leak)
new Promise(() => {});

// Stop tracking when done (important in automated tests)
awaitLeak.disable();
```

---

## 🟩 Usage in React (Browser)

Enable it only during **development**:

```js
// src/setupAwaitly.js
import awaitLeak from "await-leak-detector";

if (process.env.NODE_ENV === "development") {
  awaitLeak.enable({
    timeoutMs: 2000,   // how long to wait before reporting a leak
    intervalMs: 500    // how frequently to scan pending promises
  });
}
```

Then import this early in your app entry point:

```js
// src/index.js
import "./setupAwaitly";
```

This ensures promises created during app bootstrap are also tracked.

---

## 📚 API Reference

### **`awaitLeak.enable([options])`**

Starts tracking newly created promises.

**Options:**

* `timeoutMs` *(number)* – how long a promise can stay pending before it’s considered a leak
  **default:** `5000`
* `intervalMs` *(number)* – how often the system checks for pending promises
  **default:** `1000`

You can call this in three ways:

```js
awaitLeak.enable();                          // use defaults
awaitLeak.enable(3000);                      // timeout only
awaitLeak.enable({ timeoutMs: 3000 });       // options object
awaitLeak.enable({ timeoutMs: 3000, intervalMs: 500 });
```

---

### **`awaitLeak.disable()`**

Stops tracking, restores the original global Promise, and clears any internal state.

Use this when:

* Your test has finished running
* You want to temporarily turn off the leak detector
* You want to re-enable with different options

---

### **Diagnostics (`awaitLeak.tracker`)**

```js
awaitLeak.tracker.getPendingCount();   // number of tracked pending promises
awaitLeak.tracker.getPendingTraces();  // traces associated with each pending promise
awaitLeak.tracker.clear();             // reset internal state
```

These helpers are useful for testing or for custom tooling.

---

## ⚠️ Important Warning

`awaitly` **monkey-patches** the global Promise object.
While safe for local development, this can:

* Interfere with polyfills or shims
* Affect some 3rd-party libraries that extend `Promise`
* Cause unpredictable behavior in production builds

👉 **Use it ONLY for debugging or testing**, never in production apps.

---