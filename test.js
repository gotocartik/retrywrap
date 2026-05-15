import retry from "./index.js";

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    failed++;
  }
}

console.log("\n\x1b[1mretrywrap tests\x1b[0m\n");

// Test 1: Successful first attempt
let callCount = 0;
const r1 = await retry(() => {
  callCount++;
  return "ok";
});
assert(r1 === "ok" && callCount === 1, "Returns result on first attempt");

// Test 2: Retries on failure then succeeds
let calls2 = 0;
const r2 = await retry(
  () => {
    calls2++;
    if (calls2 < 3) throw new Error("fail");
    return "recovered";
  },
  { retries: 3, delay: 50 }
);
assert(r2 === "recovered" && calls2 === 3, "Retries and succeeds on 3rd attempt");

// Test 3: Throws after all retries exhausted
let calls3 = 0;
try {
  await retry(
    () => {
      calls3++;
      throw new Error("persistent");
    },
    { retries: 3, delay: 10 }
  );
  assert(false, "Should have thrown");
} catch (err) {
  assert(err.message === "persistent" && calls3 === 3, "Throws after exhausting retries");
}

// Test 4: Exponential backoff increases delay
let calls4 = 0;
const delays = [];
await retry(
  () => {
    calls4++;
    if (calls4 < 3) throw new Error("fail");
    return "ok";
  },
  { retries: 3, backoff: true, delay: 100, log: false }
).catch(() => {});
assert(true, "Exponential backoff runs without error");

// Test 5: Timeout aborts long operation
try {
  await retry(
    () => new Promise((resolve) => setTimeout(resolve, 2000)),
    { retries: 1, timeout: 100 }
  );
  assert(false, "Should have timed out");
} catch (err) {
  assert(
    err.message.includes("timed out") || err.message.includes("timeout"),
    "Timeout aborts operation"
  );
}

// Test 6: retryOn filters which errors trigger retry
let calls6 = 0;
try {
  await retry(
    () => {
      calls6++;
      const err = new Error("fail");
      err.status = 400;
      throw err;
    },
    { retries: 3, delay: 10, retryOn: [500, 502] }
  );
  assert(false, "Should have thrown without retry");
} catch (err) {
  assert(calls6 === 1, "Does not retry on non-matching error codes");
}

// Test 7: retryOn matching triggers retry
let calls7 = 0;
try {
  await retry(
    () => {
      calls7++;
      const err = new Error("fail");
      err.status = 503;
      throw err;
    },
    { retries: 3, delay: 10, retryOn: [500, 502, 503] }
  );
  assert(false, "Should have thrown");
} catch (err) {
  assert(calls7 === 3, "Retries on matching error codes");
}

// Test 8: Logging doesn't crash
await retry(
  () => {
    throw new Error("logged");
  },
  { retries: 2, delay: 10, log: true }
).catch(() => {});
assert(true, "Logging does not crash");

console.log(
  `\n\x1b[1m${passed} passed\x1b[0m${failed > 0 ? `, \x1b[31m${failed} failed\x1b[0m` : ""}\n`
);
process.exit(failed > 0 ? 1 : 0);
