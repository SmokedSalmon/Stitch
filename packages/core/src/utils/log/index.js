import Logger from './Logger'

class Log {
  /**
   * Get a logger instance.
   * @static
   * @param loggerName
   * @return {Logger} instance of logger for the loggerName
   */
  getLogger (loggerName) {
    if (!loggerName) {
      console.warn('No category provided.')
    }
    return new Logger(loggerName || 'default')
  }
}

export default new Log()
