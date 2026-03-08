import { env } from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Garder seulement les 100 derniers logs

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
    };

    this.logs.push(entry);

    // Garder seulement les derniers logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  debug(message: string, context?: string, data?: any) {
    if (!env.enableDebugLogs) return;
    
    this.addLog('debug', message, context, data);
    console.log(this.formatMessage('debug', message, context), data || '');
  }

  info(message: string, context?: string, data?: any) {
    if (!env.enableDebugLogs) return;
    
    this.addLog('info', message, context, data);
    console.log(this.formatMessage('info', message, context), data || '');
  }

  warn(message: string, context?: string, data?: any) {
    this.addLog('warn', message, context, data);
    console.warn(this.formatMessage('warn', message, context), data || '');
  }

  error(message: string, context?: string, data?: any) {
    this.addLog('error', message, context, data);
    console.error(this.formatMessage('error', message, context), data || '');
  }

  // Récupérer les logs (utile pour le debugging)
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Nettoyer les logs
  clearLogs() {
    this.logs = [];
  }

  // Exporter les logs (pour le support)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();

// Helpers pour les contextes courants
export const dbLogger = {
  debug: (msg: string, data?: any) => logger.debug(msg, 'Database', data),
  info: (msg: string, data?: any) => logger.info(msg, 'Database', data),
  warn: (msg: string, data?: any) => logger.warn(msg, 'Database', data),
  error: (msg: string, data?: any) => logger.error(msg, 'Database', data),
};

export const apiLogger = {
  debug: (msg: string, data?: any) => logger.debug(msg, 'API', data),
  info: (msg: string, data?: any) => logger.info(msg, 'API', data),
  warn: (msg: string, data?: any) => logger.warn(msg, 'API', data),
  error: (msg: string, data?: any) => logger.error(msg, 'API', data),
};

export const storeLogger = {
  debug: (msg: string, data?: any) => logger.debug(msg, 'Store', data),
  info: (msg: string, data?: any) => logger.info(msg, 'Store', data),
  warn: (msg: string, data?: any) => logger.warn(msg, 'Store', data),
  error: (msg: string, data?: any) => logger.error(msg, 'Store', data),
};

export default logger;
