const getLimit = (req) => {
  const defaultLimit = 100;

  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    return limit > defaultLimit ? defaultLimit : limit;
  }

  return defaultLimit;
};

module.exports = {
  getLimit,
};
