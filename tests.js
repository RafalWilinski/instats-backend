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
const UserController = require('./controllers/User/index');
const helpers = require('./helpers');

const testId = config('test_user_id');
const testInstagramId = config('instagram_test_id');
const testInstagramAccessToken = config('instagram_test_access_token');
const testPhotoId = config('test_photo_id');
const testSmallProfile = config('test_small_profile');

describe('Config tests', () => {
  before(() => {
    process.env.TEST_VARIABLE = 'abc';
  });

  it('Gets variable from environment if config is not available', () => {
    expect(config('test_variable')).to.be.equal('abc');
  });

  it('Healthcheck responds OK status', (done) => {
    request(app)
      .get('/healthcheck')
      .expect(200)
      .end((err) => {
        if (err) throw new Error(err);
        done();
      })
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
});

describe('API Integration Tests', () => {
  before((done) => {
    postgres('users')
      .where({
        instagram_name: 'new-test-user'
      })
      .delete()
      .then(() => {
        done();
      })
      .catch(() => {
        throw new Error();
      });
  });

  describe('/api/user/stats', () => {
    it('Failes to fetch follows without access token', (done) => {
      const url = `/api/user/1/stats`;
      request(app)
        .get(url)
        .expect(403, done);
    });

    it('Fetches stats with correct userId and correct access_token', (done) => {
      const url = `/api/user/${testId}/stats?access_token=${testInstagramAccessToken}`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.greaterThan(10);
          done();
        });
    });

    it('Fetches stats with correct userId and correct access_token with correct date', (done) => {
      const url = `/api/user/${testId}/stats?access_token=${testInstagramAccessToken}&from=2017-04-01&to=2017-04-02`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.equal(96);
          done();
        });
    });
  });

  describe('/api/user/request_access_token', () => {
    it('Failes to exchange token without token supplied', (done) => {
      const url = `/api/user/request_access_token`;
      request(app)
        .post(url)
        .expect(403, done);
    });

    it('Failes to exchange token when token supplied is invalid', (done) => {
      const url = `/api/user/request_access_token`;
      request(app)
        .post(url)
        .send({
          code: 123,
        })
        .expect(403, done);
    });
  });

  describe('/api/user/photo', () => {
    it('Returns photo analytics with 10 limit', (done) => {
      const url = `/api/user/${testId}/photo/${testPhotoId}?limit=10&from=2016-05-05&to=2017-05-06`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.equal(10);
          done();
        });
    });

    it('Returns photo analytics with with maximum limit', (done) => {
      const url = `/api/user/${testId}/photo/${testPhotoId}?limit=999&mod=3&from=2016-05-05&to=2017-05-06`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.equal(999);
          done();
        });
    });

    it('Returns photo analytics with with default limit', (done) => {
      const url = `/api/user/${testId}/photo/${testPhotoId}?from=2016-05-05&to=2017-05-06`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.equal(1000);
          done();
        });
    });

    it('Returns error when id not supplied', (done) => {
      const url = `/api/user/${testId}/photo/`;
      request(app)
        .get(url)
        .expect(404, done);
    });
  });

  describe('/api/user/photos', () => {
    it('Returns photos when called with correct userId', (done) => {
      const url = `/api/user/${testId}/photos?userId=${testId}`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.greaterThan(5);
          done();
        });
    });

    it('Returns error when called with invalid userId', (done) => {
      const url = `/api/user/chuj/photos`;
      request(app)
        .get(url)
        .expect(500, done);
    });
  });

  describe('/small_profile', () => {
    it('Returns 422 when called without id', (done) => {
      const url = `/api/small_profile?i=${testId}`;
      request(app)
        .get(url)
        .expect(422, done);
    });

    it('Returns 404 when called with ID not present in database', (done) => {
      const url = `/api/small_profile?id=a`;
      request(app)
        .get(url)
        .expect(404, done);
    });

    it('Returns small profile when called with correct ID', (done) => {
      const url = `/api/small_profile?id=${testSmallProfile}`;
      request(app)
        .get(url)
        .expect(200)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('object');
          done();
        });
    });
  });

  describe('/small_profiles', () => {
    it('Returns 422 when called without ids', (done) => {
      const url = `/api/small_profiles?id=${testId}`;
      request(app)
        .get(url)
        .expect(422, done);
    });

    it('Returns array of profiles when called with valid ids', (done) => {
      const url = `/api/small_profiles?ids=1,2`;
      request(app)
        .get(url)
        .end((err, data) => {
          if (err) throw new Error(err);
          expect(data.body).to.an('array');
          expect(data.body.length).to.be.equal(2);
          done();
        });
    });
  });
});

describe('UserController functions', () => {
  it('isUserRegistered.js returns true for registered user', (done) => {
    UserController.isUserRegistered(testInstagramId)
      .then(() => {
        done();
      })
      .catch(() => {
        throw new Error();
      });
  });

  it('Registers new user', (done) => {
    UserController.registerUser({
      access_token: 123,
      user: {
        id: -111,
        username: 'new-test-user',
        token: 'this-is-super-secret',
        profile_picture: 'http://idont.know'
      }
    })
      .then(() => {
        postgres('users')
          .select('*')
          .where({
            instagram_id: -111
          })
          .then((data) => {
            expect(data[0].instagram_name).to.be.equal('new-test-user');
            done();
          })
          .catch(() => {
            throw new Error();
          });
      })
      .catch(() => {
        throw new Error();
      });
  });

  it('Updates newly created user', (done) => {
    UserController.updateAccessToken({
      user: {
        id: -111
      },
      access_token: '123'
    })
      .then(() => {
        postgres('users')
          .select('*')
          .where({
            instagram_id: -111
          })
          .then((data) => {
            expect(data[0].access_token).to.be.equal('123');
            done();
          })
          .catch(() => {
            throw new Error();
          });
      })
      .catch(() => {
        throw new Error();
      });
  });
});
