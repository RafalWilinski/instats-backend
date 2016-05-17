const CronJob = require('cron').CronJob;
const moment = require('moment');
const config = require('./config.json');
const logger = require('./log');

const startCrons = (postgres) => {
  normalUsersCron(postgres);
  premiumUsersCron(postgres);
  deleteUsersCron(postgres);
};

const normalUsersCron = (postgres) => {
  new CronJob(config.normalUserCronPattern, () => {
    logger.info('Starting normalUsersCron');

    const users = fetchUsers(postgres, false);

  }, () => {
    logger.info('normalUsersCron job stopped');
  }, config.cronAutoStart);
};

const premiumUsersCron = (postgres) => {
  new CronJob(config.premiumUserCronPattern, () => {
    logger.info('Starting premiumUsersCron');

    const users = fetchUsers(postgres, true);

  }, () => {
    logger.info('premiumUsersCron job stopped');
  }, config.cronAutoStart);
};

const deleteUsersCron = (postgres) => {
  new CronJob(config.deleteCronPattern, () => {
    logger.info('Starting deleteUsersCron');

    deleteOldData(postgres);
  }, () => {
    logger.info('deleteUsersCron job stopped');
  }, config.cronAutoStart);
};

const fetchUsers = (postgres, premium) => {
  postgres
      .select('*')
      .from('users')
      .where({
        is_premium: false
      })
      .then((users) => {
        return users.filter((user) => user.is_premium === premium);
      })
      .catch((err) => {
        logger.error('Failed to fetch normal users during cron', { err });
      });
};

const deleteOldData = (postgres) => {
  postgres('followers_arrays')
      .where(postgres.raw('now() > (timestamp + interval \'30 days\')'))
      .del()
      .then((rows) => {
        logger.info('Number rows to be deleted', { rows });
      })
      .catch((err) => {
        logger.error('Failed to delete rows during cron', { err });
      });

  postgres('followings_arrays')
      .where(postgres.raw('now() > (timestamp + interval \'30 days\')'))
      .del()
      .then((rows) => {
        logger.info('Number rows to be deleted', { rows });
      })
      .catch((err) => {
        logger.error('Failed to delete rows during cron', { err });
      });
};

module.exports = startCrons;