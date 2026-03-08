const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "INFO";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (shouldLog("DEBUG")) console.error(`[${timestamp()}] [DEBUG] ${msg}`, ...args);
  },
  info: (msg: string, ...args: unknown[]) => {
    if (shouldLog("INFO")) console.error(`[${timestamp()}] [INFO] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (shouldLog("WARN")) console.error(`[${timestamp()}] [WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    if (shouldLog("ERROR")) console.error(`[${timestamp()}] [ERROR] ${msg}`, ...args);
  },
};
