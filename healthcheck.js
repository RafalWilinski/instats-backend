'use strict';

const check = (req, res) => {
  return res.json({
    reachable: 'OK',
    port: process.env.PORT || 3000,
  });
};

module.exports = check;
