const instagram = require('../instagram');

const getFollowers = (req, res) => {

};

const getFollowings = (req, res) => {

};

const getStats = (req, res) => {
  
};

const getUserInfo = (req, res) => {
  instagram.fetchStats(req.body.id, req.body.access_token).then((payload) => {

    res.status(200);
    return res.json({

    });
  });
};

const exchangeCodeForToken = (req, res) => {

};

const promoteUser = (req, res) => {

};

module.exports = {
  getFollowers,
  getFollowings,
  getStats,
  getUserInfo,
  exchangeCodeForToken,
  promoteUser
};
