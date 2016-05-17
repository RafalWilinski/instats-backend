const CronJob = require('cron').CronJob;
const config = require('./config.json');

const startCrons = (postgres) => {
  normalUsersCron(postgres);
  premiumUsersCron(postgres);
  deleteUsersCron(postgres);
};

const normalUsersCron = (postgres) => {
  new CronJob(config.normalUserCronPattern, () => {

  });
};

const premiumUsersCron = (postgres) => {

};

const deleteUsersCron = (postgres) => {

};

module.exports = startCrons;