const logger = require('../log');

const returnData = (data, res) => {
  res.status(200);
  return res.json(data);
};

const returnStatus = (errorMessage, status, res) => {
  const args = Object.keys(arguments)
    .filter(arg => parseInt(arg) > 2)
    .map(arg => ({arg : arguments[arg]}));


  logger.error(errorMessage, args);

  res.status(status);
  return res.json({
    error: errorMessage,
    args,
  });
};

module.exports = {
  returnData,
  returnStatus,
};
