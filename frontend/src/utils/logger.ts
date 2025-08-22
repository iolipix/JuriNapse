// Secure logger utility - completely disabled for production security
// No logs will be output to prevent information exposure via F12

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

// Completely disabled logger - no output whatsoever
const secureLogger: Logger = {
  log: () => {}, // No-op
  warn: () => {}, // No-op
  error: () => {}, // No-op
  info: () => {}, // No-op
  debug: () => {}, // No-op
};

export { secureLogger };
export default secureLogger;