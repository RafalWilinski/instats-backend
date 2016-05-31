const CronJob = require('cron').CronJob;
const Promise = require('bluebird');
const moment = require('moment');
const config = require('./config.js');
const logger = require('./log');
const metrics = require('./metrics');

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
  }, config('cron_auto_start'));
};

const premiumUsersCron = (postgres) => {
  new CronJob(config('premium_users_cron_pattern'), () => {
    logger.info('Starting premiumUsersCron');

    fetchUsersAndFollows(postgres, true);

  }, () => {
    logger.info('premiumUsersCron job stopped');
  }, config('cron_auto_start'));
};

const fetchUsersAndFollows = (postgres, isPremium) => {
  fetchUsers(postgres, isPremium).then((users) => {
    for (var i = 0; i < users.length; i++) {
      fetchFollows(users[i], i);
    }
  });

  const fetchFollows = (user, i) => {
    setTimeout(() => {
      instagram.fetchFollowers(user.id, user.instagram_id, user.access_token)
        .then((followersArray) => {
          insertArray(user.id, followersArray, true, postgres);
          insertSmallProfiles(followersArray, postgres);
        })
        .catch(() => {
          logger.error('failed to fetch follows');
        });

      instagram.fetchFollowings(user.id, user.instagram_id, user.access_token)
        .then((followsArray) => {
          insertArray(user.id, followsArray, false, postgres);
          insertSmallProfiles(followsArray, postgres);
        })
        .catch(() => {
          logger.error('failed to fetch follows');
        });
    }, i * 500);
  }
};

const deleteUsersCron = (postgres) => {
  new CronJob(config('delete_cron_pattern'), () => {
    logger.info('Starting deleteUsersCron');

    deleteOldData(postgres);
  }, () => {
    logger.info('deleteUsersCron job stopped');
  }, config('cron_auto_start'));
};

const fetchUsers = (postgres, premium) => new Promise((resolve, reject) => {
  postgres
    .select('*')
    .from('users')
    .where({
      is_premium: premium,
      access_token_validity: true
    })
    .then((users) => {
      return resolve(users.filter((user) => user.is_premium === premium));
    })
    .catch((err) => {
      logger.error('Failed to fetch normal users during cron', { err });
      return reject();
    });
});


const deleteOldData = (postgres) => new Promise((resolve, reject) => {
  var jobsCount = 0;
  const rowsSum = [];
  postgres('followers_arrays')
    .where(postgres.raw('now() > (timestamp + interval \'30 days\')'))
    .returning('id')
    .delete()
    .then((rows) => {
      metrics.deleteSuccess.inc();
      logger.info('Number rows to be deleted', { rows });
      check(rows);
    })
    .catch((err) => {
      metrics.deleteFail.inc();
      logger.error('Failed to delete rows during cron', { err });
      return reject();
    });

  postgres('followings_arrays')
    .where(postgres.raw('now() > (timestamp + interval \'30 days\')'))
    .returning('id')
    .delete()
    .then((rows) => {
      metrics.deleteSuccess.inc();
      logger.info('Number rows to be deleted', { rows });
      check(rows);
    })
    .catch((err) => {
      metrics.deleteFail.inc();
      logger.error('Failed to delete rows during cron', { err });
      return reject();
    });

  const check = (rows) => {
    logger.info('Removed', rows);
    rowsSum.push(rows);
    jobsCount++;
    if (jobsCount == 2) return resolve(rowsSum);
  }
});

const insertArray = (userId, usersArray, isFollowers, postgres) => new Promise((resolve, reject) => {
  const tableName = isFollowers ? 'followers_arrays' : 'followings_arrays';
  const array = `{${usersArray.map((user) => user.id)}}`;
  postgres(tableName)
    .insert({
      user_ref: userId,
      timestamp: new Date().toUTCString(),
      users_array: array
    })
    .returning('id')
    .then((data) => {
      metrics.arraySuccess.inc();
      logger.info('data inserted', {
        tableName,
        userId,
        data
      });

      return resolve(data);
    })
    .catch((error) => {
      metrics.arrayFail.inc();
      logger.error('failed to insert data', {
        error,
        userId,
        tableName
      });

      return reject();
    });
});

const insertSmallProfiles = (usersArray, postgres) => new Promise((resolve, reject) => {
  const userIds = usersArray.map((user) => user.id);

  postgres('small_profiles')
    .select('instagram_id')
    .whereIn('instagram_id', userIds)
    .then((data) => {
      metrics.spDuplicate.inc(data.length);
      insert(difference(userIds, data));
    })
    .catch((error) => {
      logger.warn('Failed to enter small profile', error);
    });

  const difference = (array_1, array_2) => {
    return array_1.filter((obj) => {
      return !array_2.some((obj2) => {
        return obj.value == obj2.value;
      });
    });
  };

  const insert = (users) => {
    if (users.length > 0) {
      logger.info('Inserting small_profiles', {
        count: users.length
      });

      const insertableUsers = users.map((user) => {
        return {
          instagram_id: user.id,
          name: user.username,
          profile_picture: user.profile_picture
        };
      });

      postgres('small_profiles')
        .insert({
          insertableUsers
        })
        .then((data) => {
          logger.info('Small profiles inserted', data);
          metrics.spSuccess.inc(insertableUsers.length);
          return resolve();
        })
        .catch((err) => {
          logger.warn('Failed to enter small profile', err);
          metrics.spFail.inc(insertableUsers.length);
          return reject();
        });
    } else {
      return resolve();
    }
  }
});

module.exports = {
  normalUsersCron,
  deleteOldData,
  insertSmallProfiles,
  insertArray,
  startCrons
};