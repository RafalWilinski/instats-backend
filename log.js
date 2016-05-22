const winston = require('winston');

const log = new (winston.Logger)({
  levels: {
    trace: 0,
    input: 1,
    verbose: 2,
    prompt: 3,
    debug: 4,
    info: 5,
    data: 6,
    help: 7,
    warn: 8,
    error: 9
  },
  colors: {
    trace: 'magenta',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    debug: 'blue',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    error: 'red'
  },
  transports: [
    new (winston.transports.Console)({
      level: 'error',
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: false
    }),
    new (winston.transports.File)({
      filename: 'instats.log',
      prettyPrint: false,
      level: 'error',
      silent: false,
      colorize: true,
      timestamp: true,
      maxsize: 10000000,
      maxFiles: 10,
      json: false
    })
  ]
});

module.exports = log;