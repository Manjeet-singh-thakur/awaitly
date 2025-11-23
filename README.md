
---

# **await-leak-detector**

### *Catch un-awaited Promises before they crash your app*

`await-leak-detector` (nicknamed **awaitly**) is a development-time tool that helps you find **un-awaited Promises** — one of the most common hidden sources of:

* Silent async failures
* Background “ghost” operations
* Hanging Jest/Mocha tests
* Memory leaks
* API calls that never complete
* Mongoose queries stuck forever

It works by monkey-patching the global `Promise` constructor and tracking any newly-created Promises that **start execution but never resolve**.

> ⚠️ **Use only in development or testing environments.**
> Never enable this in production.

---

# ⭐ Features

* 🔍 Detects un-awaited async operations
* ⚡ Detects Axios/fetch leaks
* 🍃 Detects MongoDB leaks *(only when queries actually start)*
* 🧪 Perfect for Mocha/Jest debugging
* 🛠 Minimal API – just `enable()` and `disable()`
* 📌 Provides diagnostics for pending Promises
* 🔄 Zero dependencies

---

# 📦 Installation

```bash
npm install await-leak-detector
```

---

# 🚀 Quick Start

```js
const awaitLeak = require("await-leak-detector");

// Start tracking
awaitLeak.enable();

// Un-awaited promise (simulated leak)
new Promise(() => {});

// Stop tracking and restore Promise
awaitLeak.disable();
```

---

# 🧠 Understanding How Leak Detection Works

`await-leak-detector` **only tracks Promises that actually start running**.

That means:

### ✔ Axios / Fetch → **always detected**

Because they immediately create a real Promise:

```js
axios.get("/api");      // detected as leak
fetch("/data");         // detected as leak
```

### ✔ MongoDB (Mongoose) → **detected only when executed**

**Lazy query → not detected:**

```js
Users.findOne({});       // NOT detected — no Promise is created yet
```

**Executed query → detected:**

```js
Users.findOne({}).exec();  // DETECTED — real Promise created
await Users.findOne();     // DETECTED
```

Why?
Mongoose queries are **lazy** — they don’t create a Promise until:

* `.exec()` is called
* `await` is used
* `.then()` is used

---

# 🟩 Recommended Usage (Node.js)

### Detect leaks inside your application startup:

```js
const awaitLeak = require("await-leak-detector");

if (process.env.NODE_ENV !== "production") {
  awaitLeak.enable({ timeoutMs: 3000, intervalMs: 500 });
}
```

---

# 🟦 Usage in React / Browser

```js
// src/setupAwaitly.js
import awaitLeak from "await-leak-detector";

if (process.env.NODE_ENV === "development") {
  awaitLeak.enable({
    timeoutMs: 2000,
    intervalMs: 500
  });
}
```

and import early:

```js
import "./setupAwaitly";
```

---

# 🔥 Real Examples

## 1️⃣ **Leaking Axios Request (detected)**

```js
async function leak() {
  axios.get("https://api.example.com");  // un-awaited → LEAK
}
leak();
```

---

## 2️⃣ **Leaking Mongoose Query (detected)**

```js
async function leak() {
  Users.findOne({}).exec();   // un-awaited exec() → LEAK
}
leak();
```

---

## 3️⃣ **Mongoose lazy query (NOT detected)**

```js
Users.findOne({});  // does NOT create a real Promise yet
```

This is expected.

---

## 4️⃣ **Proper awaited async function (safe)**

```js
async function safe() {
  return await axios.get("/api");
}
```

---

# 📚 API

## **`awaitLeak.enable([options])`**

Starts tracking newly created Promises.

### Options

| Option       | Type   | Default | Description                                               |
| ------------ | ------ | ------- | --------------------------------------------------------- |
| `timeoutMs`  | number | 5000    | How long a promise can stay pending before marked as leak |
| `intervalMs` | number | 1000    | How frequently to scan pending promises                   |

### Examples

```js
awaitLeak.enable();
awaitLeak.enable(3000);
awaitLeak.enable({ timeoutMs: 3000 });
awaitLeak.enable({ timeoutMs: 3000, intervalMs: 500 });
```

---

## **`awaitLeak.disable()`**

Stops tracking and restores the original global Promise.

Use when:

* Tests finish running
* You want to reset internal state
* You re-enable with different settings

---

# 🧪 Testing Support

You can access diagnostics:

```js
awaitLeak.tracker.getPendingCount();   // number of pending promises
awaitLeak.tracker.getPendingTraces();  // stack traces of leaked promises
awaitLeak.tracker.clear();             // reset
```

---

# ⚠️ Warnings & Limitations

* This module overrides the **global Promise** — use only in dev/test.
* Lazy async operations (like Mongoose queries) are only detected when executed.
* Some libraries that monkey-patch Promises may conflict.
* Should not be used in SSR production environments.

---

# 👍 Why Use This?

Because mistakes like this are extremely common:

```js
Users.findOne({});         // no await → silently ignored
axios.post("/create");     // request sent but no error shown
doSomethingAsync();        // background promise → never handled
```

`await-leak-detector` helps you catch them **immediately**, with stack traces.

---

# 📜 License

MIT © 2025

---