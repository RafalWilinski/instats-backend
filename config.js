/*
Configuration resolver class which takes sensitive data from supplied file or environment variables
 */

const config = require('./config.json');

const getVariable = (key) => {
  if (require('./config.json') && require('./config.json')[key] !== undefined) return require('./config.json')[key];
  if (process.env[key.toUpperCase()] !== undefined) return process.env[key.toUpperCase()];
  throw new Error(`Unresolved config variable \'${key}\'`);
};

module.exports = getVariable;
