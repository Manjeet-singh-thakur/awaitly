'use strict';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

class Logger {
  info(message) {
    console.log(`${colors.blue}[await-leak]${colors.reset} ${message}`);
  }

  warn(message) {
    console.warn(`${colors.yellow}[await-leak]${colors.reset} ${message}`);
  }

  error(message) {
    console.error(`${colors.red}[await-leak]${colors.reset} ${message}`);
  }

  debug(message) {
    if (process.env.DEBUG) {
      console.debug(`${colors.gray}[await-leak]${colors.reset} ${message}`);
    }
  }
}

module.exports = {
  logger: new Logger()
};