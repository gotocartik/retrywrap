export default async function retry(fn, options = {}) {
  const {
    retries = 3,
    delay: baseDelay = 1000,
    backoff = false,
    retryOn = null,
    timeout = 0,
    log = false,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let result;

      if (timeout > 0) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
          result = await Promise.race([
            fn(controller.signal),
            new Promise((_, reject) => {
              controller.signal.addEventListener("abort", () => {
                reject(new Error(`Operation timed out after ${timeout}ms`));
              });
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      } else {
        result = await fn();
      }

      return result;
    } catch (err) {
      lastError = err;

      if (retryOn && !retryOn.some((code) => err.message.includes(code) || err.status === code || err.code === code)) {
        throw err;
      }

      if (attempt === retries) {
        throw err;
      }

      if (log) {
        console.log(`\x1b[2m[retrywrap]\x1b[0m Attempt ${attempt}/${retries} failed: ${err.message}`);
      }

      let wait = baseDelay;
      if (backoff) {
        wait = baseDelay * Math.pow(2, attempt - 1);
      }

      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw lastError;
}
