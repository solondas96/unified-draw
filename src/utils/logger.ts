/**
 * A lightweight structured logger for UnifiedDraw.
 * In a full FAANG environment, this would forward JSON logs to Datadog, Sentry, or ELK.
 */
export const Logger = {
  info: (message: string, context?: Record<string, any>) => {
    const log = {
      level: "INFO",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.log(JSON.stringify(log));
  },

  error: (message: string, error?: any, context?: Record<string, any>) => {
    const log = {
      level: "ERROR",
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    };
    console.error(JSON.stringify(log));
  },

  warn: (message: string, context?: Record<string, any>) => {
    const log = {
      level: "WARN",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.warn(JSON.stringify(log));
  },
};
