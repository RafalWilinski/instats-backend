const CronJob = require('cron').CronJob;
const Promise = require('bluebird');
const moment = require('moment');
const config = require('./config.js');
const logger = require('./log');
const metrics = require('./metrics');

const instagram = require('./instagram');

const FOLLOWERS_ARRAYS = 'followers_arrays';
const FOLLOWINGS_ARRAYS = 'followings_arrays';

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
    logger.info('Processing users CRON', {
      count: users.length,
      isPremium,
    });

    for (var i = 0; i < users.length; i++) {
      fetchData(users[i], i);
    }
  });

  const fetchData = (user, i) => {
    console.log('fetching');
    setTimeout(() => {
      instagram.fetchFollowers(user.id, user.instagram_id, user.access_token)
        .then((followersArray) => {
          insertArray(user.id, followersArray, FOLLOWERS_ARRAYS, postgres);
          insertSmallProfiles(followersArray, postgres);
        })
        .catch(() => {
          logger.error('failed to fetch follows');
        });

      instagram.fetchFollowings(user.id, user.instagram_id, user.access_token)
        .then((followsArray) => {
          insertArray(user.id, followsArray, FOLLOWINGS_ARRAYS, postgres);
          insertSmallProfiles(followsArray, postgres);
        })
        .catch(() => {
          logger.error('failed to fetch follows');
        });

      instagram.fetchPhotos(user.id, user.instagram_id, user.access_token)
        .then((photos) => {
          logger.info('Processing photos of user', {
            userId: user.id,
            count: photos.length,
          });

          insertPhotoAndCounts(user.id, photos, postgres);
        })
        .catch(() => {
          logger.error('failed to insert photos');
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

const insertPhotoAndCounts = (userId, photos, postgres) => new Promise((resolve, reject) => {
  const difference = (newData, oldData) => {
    return newData.filter((newEntry) => {
      return oldData.filter((oldEntry) => oldEntry.instagram_photo_id === newEntry.id).length === 0;
    });
  };

  const insert = (photos) => new Promise((resolve, reject) => {
    if (photos.length > 0) {
      logger.info('Inserting photos', {
        count: photos.length
      });

      const insertablePhotos = photos.map((photo) => {
        return {
          instagram_photo_id: photo.id,
          timestamp: moment.unix(photo.created_time),
          tags: photo.tags,
          thumbnail_url: photo.images.thumbnail.url,
          original_url: photo.images.standard_resolution.url,
          filter: photo.filter,
          location: photo.location,
          user: userId
        };
      });

      postgres('photos')
        .insert(
          insertablePhotos
        )
        .then((data) => {
          logger.info('Photos inserted', data);
          return resolve();
        })
        .catch((error) => {
          logger.warn('Failed to enter photo', error);
          return reject(error);
        });
    } else {
      logger.info('No new photos to insert');
      return resolve();
    }
  });

  const insertCounts = (userId, photos, postgres) => {
    const insertables = photos.map((photo) => ({
      photo: photo.id,
      likes: photo.likes.count,
      timestamp: new Date().toUTCString()
    }));

    postgres('photos_likes').insert(insertables)
      .then((data) => logger.info('photos likes inserted', data))
      .catch((error) => logger.error('failed to save photo likes', {error}));
  };

  postgres('photos')
    .select('instagram_photo_id')
    .whereIn('instagram_photo_id', photos.map((entry) => entry.id))
    .then((data) => {
      logger.info('Duplicate photos', { count: data.length });
      insert(difference(photos, data)).then(() => {
        insertCounts(userId, photos, postgres);
      }).catch((error) => {
        return reject(error);
      });
    }).catch((error) => {
      logger.error('Failed to find duplicate photos and compute difference', { error });
      return reject(error);
    });
});

const insertArray = (userId, usersArray, tableName, postgres) => new Promise((resolve, reject) => {
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
  console.log('Inserting small profiles');
  const userIds = usersArray.map((user) => user.id);

  const difference = (newData, oldData) => {
    return newData.filter((newEntry) => {
      return oldData.filter((oldEntry) => oldEntry.instagram_id === newEntry.id).length === 0;
    });
  };

  postgres('small_profiles')
    .select('instagram_id')
    .whereIn('instagram_id', userIds)
    .then((data) => {
      insert(difference(usersArray, data));
    })
    .catch((error) => {
      logger.warn('Failed to enter small profile', error);
    });

  const insert = (users) => {
    if (users.length > 0) {
      logger.info('Inserting small_profiles', {
        count: users.length
      });

      const insertableUsers = users.map((user) => {
        return {
          instagram_id: user.id,
          name: user.username,
          picture_url: user.profile_picture
        };
      });

      postgres('small_profiles')
        .insert(
          insertableUsers
        )
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