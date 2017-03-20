const logger = require('../log');

const returnData = (data, res) => {
  res.status(200);
  return res.json(data);
};

const returnStatus = (errorMessage, status, res, error = {}) => {
  logger.error(errorMessage, error);

  res.status(status);
  return res.json({
    errorMessage,
    error,
  });
};

module.exports = {
  returnData,
  returnStatus,
};
