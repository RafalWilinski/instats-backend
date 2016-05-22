/*
Configuration resolver class which takes sensitive data from supplied file or environment variables
 */

const getVariable = (key) => {
  if (process.env[key.toUpperCase()] !== undefined) return process.env[key.toUpperCase()];
  throw new Error(`Unresolved config variable \'${key}\'`);
};

module.exports = getVariable;
