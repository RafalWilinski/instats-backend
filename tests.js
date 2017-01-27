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

  it('Healthcheck responds OK status', (done) => {
    request(app)
      .get('/healthcheck')
      .expect(200)
      .end((err) => {
        if (err) throw new Error(err);
        done();
      })
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
