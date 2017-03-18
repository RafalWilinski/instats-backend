const getLimit = (req) => {
  const defaultLimit = 100;

  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    return limit > defaultLimit ? defaultLimit : limit;
  }

  return defaultLimit;
};

const getOffset = (req) => {
  if (req.query.offset) {
    const offset = parseInt(req.query.offset);
    return offset;
  }

  return 0;
};

module.exports = {
  getLimit,
  getOffset,
};
