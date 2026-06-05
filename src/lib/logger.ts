export type LogContext = Record<string, unknown>;

type LogLevel = "info" | "warn" | "error";
type LoggerImportMeta = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

const isDevelopment = (import.meta as LoggerImportMeta).env?.DEV === true;

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  if (!isDevelopment && level !== "error") {
    return;
  }

  const payload = context ? [message, context] : [message];

  if (level === "info") {
    console.info(...payload);
  } else if (level === "warn") {
    console.warn(...payload);
  } else {
    console.error(...payload);
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },

  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },

  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  },
};
