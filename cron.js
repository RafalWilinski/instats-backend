const CronJob = require('cron').CronJob;
const Promise = require('bluebird');
const moment = require('moment');
const config = require('./config.js');
const logger = require('./log');

const instagram = require('./instagram');

const startCrons = (postgres) => {
  normalUsersCron(postgres);
  premiumUsersCron(postgres);
  deleteUsersCron(postgres);
};

const normalUsersCron = (postgres) => {
  new CronJob(config('normal_users_cron_pattern'), () => {
    logger.info('Starting normalUsersCron');

    fetchUsersAndFollows(postgres, false);

  }, () => {
    logger.info('normalUsersCron job stopped');
  }, config.cronAutoStart);
};

const premiumUsersCron = (postgres) => {
  new CronJob(config('premium_users_cron_pattern'), () => {
    logger.info('Starting premiumUsersCron');

    fetchUsersAndFollows(postgres, true);

  }, () => {
    logger.info('premiumUsersCron job stopped');
  }, config.cronAutoStart);
};

const fetchUsersAndFollows = (postgres, isPremium) => {
  fetchUsers(postgres, isPremium).then((users) => {
    users.forEach((user) => {
      instagram.fetchFollowers(user.id, user.instagram_id, user.access_token)
          .then((followersArray) => {
            insertFollowersArray(followersArray, postgres);
            insertSmallProfiles(followersArray, postgres);
          })
          .catch(() => {
            log.error('failed to fetch follows');
          });
      instagram.fetchFollowings(user.id, user.instagram_id, user.access_token)
          .then((followsArray) => {
            insertFollowsArray(followsArray, postgres);
            insertSmallProfiles(followsArray, postgres);
          })
          .catch(() => {
            log.error('failed to fetch follows');
          });
    });
  });
};

const deleteUsersCron = (postgres) => {
  new CronJob(config('delete_cron_pattern'), () => {
    logger.info('Starting deleteUsersCron');

    deleteOldData(postgres);
  }, () => {
    logger.info('deleteUsersCron job stopped');
  }, config.cronAutoStart);
};

const fetchUsers = (postgres, premium) => new Promise((resolve, reject) => {
  postgres
      .select('*')
      .from('users')
      .where({
        is_premium: premium
      })
      .then((users) => {
        console.log(users);
        return resolve(users.filter((user) => user.is_premium === premium));
      })
      .catch((err) => {
        logger.error('Failed to fetch normal users during cron', { err });
        return reject();
      });
});


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

const insertSmallProfiles = (usersArray, postgres) => new Promise((resolve, reject) => {
  usersArray.forEach((user) => {
    postgres('small_profiles')
        .insert({
          name: user.username,
          instagram_id: user.id,
          picture_url: user.profile_picture
        })
        .then((data) => {
          logger.info('Small profile inserted', data);
          return resolve();
        })
        .catch((err) => {
          logger.warn('Failed to enter small profile', err);
          return reject();
        });
  });
});

module.exports = {
  insertSmallProfiles,
  startCrons
};