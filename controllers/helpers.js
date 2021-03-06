const getLimit = (req) => {
  const defaultLimit = 1000;

  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    return limit > defaultLimit ? defaultLimit : limit;
  }

  return defaultLimit;
};

const getOffset = (req) => {
  if (req.query.offset) {
    return parseInt(req.query.offset);
  }

  return 0;
};

const getBetweenDates = (req) => {
  if (req.query.from && req.query.to) {
    return [req.query.from, req.query.to];
  }

  return ['2000-01-01', '2030-01-01'];
};

module.exports = {
  getLimit,
  getOffset,
  getBetweenDates,
};
