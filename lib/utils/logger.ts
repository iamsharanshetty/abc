// lib/utils/logger.ts

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL || "development";

    switch (envLevel) {
      case "debug":
        this.level = LogLevel.DEBUG;
        break;
      case "production":
        this.level = LogLevel.WARN;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];

    const logData = {
      timestamp,
      level: levelName,
      message,
      ...(data && { data }),
    };

    // In production, you'd send this to a logging service
    // For now, we'll use console with better formatting
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] DEBUG:`, message, data || "");
        break;
      case LogLevel.INFO:
        console.info(`[${timestamp}] INFO:`, message, data || "");
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] WARN:`, message, data || "");
        break;
      case LogLevel.ERROR:
        console.error(`[${timestamp}] ERROR:`, message, data || "");
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }
}

export const logger = new Logger();
