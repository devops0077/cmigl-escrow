type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? JSON.stringify(meta, null, 2) : "";

    // In development, log to console with colors
    if (this.isDevelopment) {
      const colors = {
        info: "\x1b[36m", // cyan
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        debug: "\x1b[35m", // magenta
        reset: "\x1b[0m", // reset
      };

      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        `${colors[level]}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`,
        meta ? meta : ""
      );
      return;
    }

    // In production, format for proper logging service consumption
    const logEntry = {
      level,
      timestamp,
      message,
      ...(meta && { meta }),
    };

    // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
    // For now, we'll just use console with proper JSON formatting
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      JSON.stringify(logEntry)
    );
  }

  info(message: string, meta?: any) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: any) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: any) {
    this.log("error", message, meta);
  }

  debug(message: string, meta?: any) {
    if (this.isDevelopment) {
      this.log("debug", message, meta);
    }
  }
}

export const logger = new Logger();
