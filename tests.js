/* global it, describe, before, post, get */

const dotenv = require('dotenv').config();
const request = require('supertest');
const fs = require('fs');
const expect = require('chai').expect;
const sinon = require('sinon');
const config = require('./config.js');
const postgres = require('./postgres');
const app = require('./app');
const instagramApi = require('./instagram');
const cron = require('./cron');
const UserController = require('./controllers/User');

const testId = 4;
const testInstagramId = config('instagram_test_id');
const testInstagramAccessToken = config('instagram_test_access_token');
const testInstagramUsername = config('instagram_test_username');

describe('Config tests', () => {
  before(() => {
    process.env.TEST_VARIABLE = 'abc';
  });

  it('Gets variable from environment if config is not available', () => {
    expect(config('test_variable')).to.be.equal('abc');
  });
});

describe('Instagram API Tests', () => {
  it('Fetches stats using instagram API', (done) => {
    instagramApi.fetchStats(testInstagramAccessToken)
        .then((data) => {
          expect(data.meta.code).to.be.equal(200);
          done();
        })
        .catch(() => {
          throw new Error();
        });
  });

  it('Fetches followers', (done) => {
    instagramApi.fetchFollowers(testId, testInstagramId, testInstagramAccessToken)
        .then((data) => {
          expect(data).to.be.an('array');
          expect(data.length).to.be.greaterThan(50);
          done();
        })
        .catch(() => {
          throw new Error();
        });
  });

  it('Fetches follows', (done) => {
    instagramApi.fetchFollowings(testId, testInstagramId, testInstagramAccessToken)
        .then((data) => {
          expect(data).to.be.an('array');
          expect(data.length).to.be.greaterThan(50);
          done();
        })
        .catch(() => {
          throw new Error();
        });
  });

  it('Fetches other user profile', (done) => {
    instagramApi.fetchProfile(testInstagramId, testInstagramAccessToken)
        .then((data) => {
          expect(data.meta.code).to.be.equal(200);
          expect(data.data.username).to.be.equal(testInstagramUsername);
          done();
        })
        .catch(() => {
          throw new Error();
        });
  });
});

describe('API Integration Tests', () => {
  it('Healthcheck responds OK status', (done) => {
    request(app)
        .get('/healthcheck')
        .expect(200)
        .end((err) => {
          if (err) throw new Error(err);
          done();
        })
  });

  it('Fails to fetch smart profile if access_token is not supplied', (done) => {
    const url = `/api/get_user_info?id=${testInstagramId}`;
    request(app)
        .get(url)
        .expect(400, done);
  });

  it('Fetches smart profile', (done) => {
    const url = `/api/get_user_info?id=${testInstagramId}&access_token=${testInstagramAccessToken}`;
    request(app)
        .get(url)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body.data.username).to.be.equal(testInstagramUsername);
          done();
        });
  });

  it('Failes to fetch followers without id', (done) => {
    const url = `/api/get_followings`;
    request(app)
        .get(url)
        .expect(400, done);
  });

  it('Fetches followers', (done) => {
    const url = `/api/get_followings?id=${testId}`;
    request(app)
        .get(url)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body.result).to.an('array');
          expect(data.body.result.length).to.be.greaterThan(50);
          done();
        });
  });

  it('Failes to fetch follows without id', (done) => {
    const url = `/api/get_followers`;
    request(app)
        .get(url)
        .expect(400, done);
  });

  it('Fetches follows', (done) => {
    const url = `/api/get_followers?id=${testId}`;
    request(app)
        .get(url)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body.result).to.an('array');
          expect(data.body.result.length).to.be.greaterThan(50);
          done();
        });
  });

  it('Failes to fetch follows without access token', (done) => {
    const url = `/api/get_stats`;
    request(app)
        .get(url)
        .expect(400, done);
  });

  it('Fetches stats', (done) => {
    const url = `/api/get_stats?access_token=${testInstagramAccessToken}`;
    request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('object');
          expect(data.body.meta.code).to.be.equal(200);
          expect(data.body.data.id).to.be.equal(testInstagramId);
          done();
        });
  });

  it('Failes to promote user without id', (done) => {
    const url = `/api/promote`;
    request(app)
        .post(url)
        .expect(400, done);
  });

  it('Promotes user', (done) => {
    const url = `/api/promote`;
    request(app)
        .post(url)
        .send({
          id: testId
        })
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body.success).to.be.equal('ok');
          check();
        });

    const check = () => {
      postgres('users')
          .select('*')
          .where({
            id: testId
          })
          .then((data) => {
            expect(data[0].is_premium).to.be.equal(true);
            done();
          })
          .catch((error) => {
            throw new Error(error);
          });
    }
  });

  it('Failes to exchange token without token supplied', (done) => {
    const url = `/api/request_access_token`;
    request(app)
        .post(url)
        .expect(403, done);
  });

  it('isUserRegistered returns true for registered user', (done) => {
    UserController.isUserRegistered(testInstagramId)
        .then(() => {
          done();
        })
        .catch(() => {
          throw new Error();
        });
  });
});

describe('Cron Integration Tests', () => {
  before((done) => {
    postgres('small_profiles')
        .where('instagram_id', '2')
        .orWhere('instagram_id', '1')
        .delete()
        .then(() => {
          done();
        });
  });

  it('Saves followers to DB', (done) => {
    const checkInsert = (originalData) => {
      postgres('followers_arrays')
          .select('*')
          .where({
            id: originalData[0]
          })
          .then((data) => {
            expect(data[0].id).to.be.equal(originalData[0]);
            done();
          })
          .catch((error) => {
            throw new Error(error);
          })
    };

    instagramApi.fetchFollowers(testId, testInstagramId, testInstagramAccessToken)
        .then((followersArray) => {
          cron.insertArray(testId, followersArray, true, postgres)
              .then((data) => {
                checkInsert(data);
              })
              .catch((error) => {
                throw new Error(error);
              });
        });
  });

  it('Saves follows to DB', (done) => {
    const checkInsert = (originalData) => {
      postgres('followings_arrays')
          .select('*')
          .where({
            id: originalData[0]
          })
          .then((data) => {
            expect(data[0].id).to.be.equal(originalData[0]);
            done();
          })
          .catch((error) => {
            throw new Error(error);
          })
    };

    instagramApi.fetchFollowings(testId, testInstagramId, testInstagramAccessToken)
        .then((followingsArrays) => {
          cron.insertArray(testId, followingsArrays, false, postgres)
              .then((data) => {
                checkInsert(data);
              })
              .catch((error) => {
                throw new Error(error);
              });
        });
  });

  it('Deletes followers and follows from DB', (done) => {
    postgres('followers_arrays')
        .insert({
          user_ref: testId,
          timestamp: new Date(1000).toUTCString(),
          users_array: '{}'
        })
        .then(() => {
          cron.deleteOldData(postgres)
              .then((rows) => {
                expect(rows.length).to.be.greaterThan(0);
                done();
              })
              .catch((error) => {
                throw new Error(error);
              });
        })
        .catch((error) => {
          throw new Error(error);
        })
  });

  it('Saves smart profile to DB', (done) => {
    cron.insertSmallProfiles([
      {
        id: 1,
        username: 'user_a',
        profile_picture: 'http://user_a.jpg'
      }, {
        id: 2,
        username: 'user_b',
        profile_picture: 'http://user_b.jpg'
      }
    ], postgres)
        .then(() => {
          postgres('small_profiles')
              .select('*')
              .where({
                instagram_id: '2'
              })
              .then((users) => {
                expect(users.length).to.be.equal(1);
                done();
              })
              .catch((error) => {
                throw new Error(error);
              });
        })
        .catch(() => {
          throw new Error();
        });

  });
});

describe('Unit Utils Tests', () => {
  it('Generates correct signature', (done) => {
    const expectedSignature = '648dccf1260a0bfa123fea3b1d88c1d8eb16bc9bc096543abead456587f54452';
    const sig = instagramApi.generateSignature('/users/self', {
      access_token: testInstagramAccessToken
    });

    expect(sig).to.be.equal(expectedSignature);
    done();
  });


  it('Computes proper JSON from URL', (done) => {
    const urlParams = "?id=123&message=ok";
    const json = instagramApi.getJsonFromUrlParams(urlParams);

    expect(json.message).to.be.equal('ok');

    done();
  });

  it('Computers proper params from JSON', (done) => {
    const json = {
      id: 123,
      message: 'ok'
    };

    const params = instagramApi.jsonToParams(json);

    expect(params).to.be.equal('id=123&message=ok');
    done();
  });
});