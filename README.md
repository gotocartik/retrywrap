# retrywrap

![npm](https://img.shields.io/npm/dt/retrywrap)
![npm](https://img.shields.io/npm/dw/retrywrap)
![npm version](https://img.shields.io/npm/v/retrywrap)
![license](https://img.shields.io/npm/l/retrywrap)

> A lightweight JavaScript utility for retrying async operations with configurable retries, delays, exponential backoff, and timeout support. Works in Node.js and browsers.

## Installation

```bash
npm install retrywrap
```

## Usage

```js
import retry from "retrywrap";

const data = await retry(() => fetch("/api/data"), {
  retries: 3,
  delay: 1000,
});
```

## Options

| Option   | Type      | Default | Description                              |
| -------- | --------- | ------- | ---------------------------------------- |
| retries  | number    | `3`     | Max retry attempts                       |
| delay    | number    | `1000`  | Delay between retries (ms)               |
| backoff  | boolean   | `false` | Enable exponential backoff               |
| timeout  | number    | `0`     | Operation timeout in ms (`0` = no timeout) |
| retryOn  | number[]  | `null`  | Only retry on matching error codes       |
| log      | boolean   | `false` | Log retry attempts to console            |

## Examples

### Basic retry

```js
const user = await retry(() => fetchUser(id), {
  retries: 5,
  delay: 500,
});
```

### Exponential backoff

```js
const result = await retry(() => api.call(), {
  retries: 4,
  delay: 200,
  backoff: true,
});
// Delays: 200ms → 400ms → 800ms → 1600ms
```

### Timeout

```js
const data = await retry(() => slowOperation(), {
  retries: 2,
  timeout: 3000,
});
// Throws if operation exceeds 3 seconds
```

### Selective retry

```js
const data = await retry(() => api.fetch(), {
  retries: 3,
  retryOn: [500, 502, 503],
});
// Only retries on server errors, not 4xx
```

### With logging

```js
const data = await retry(() => unstableApi(), {
  retries: 3,
  delay: 1000,
  log: true,
});
// [retrywrap] Attempt 1/3 failed: ...
// [retrywrap] Attempt 2/3 failed: ...
```

## Test

```bash
node test.js
```

## License

MIT
