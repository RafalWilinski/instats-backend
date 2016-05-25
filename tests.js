/* global it, describe, before, post, get */

const dotenv = require('dotenv').config();
const request = require('supertest');
const fs = require('fs');
const expect = require('chai').expect;
const config = require('./config.js');
const postgres = require('./postgres');
const app = require('./app');
const instagramApi = require('./instagram');
const logger = require('./log');

const testId = 1;
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

  it('Fetches followers', (done) => {
    done();
  });

  it('Fetches follows', (done) => {
    done();
  });

  it('Fetches stats', (done) => {
    done();
  });

  it('Promotes user', (done) => {
    done();
  });
});

describe('Cron Integration Tests', () => {
  it('Saves followers to DB', () => {

  });

  it('Saves follows to DB', () => {

  });

  it('Deletes followers and follows from DB', () => {

  });

  it('Works for premium users', () => {

  });

  it('Saves smart profile to DB', () => {

  });
});

describe('Unit Utils Tests', () => {
  it('Generates correct signature', () => {
    
  });

  it('Creates appropriate pagination URL', () => {

  });

  it('Computes proper JSON from URL', () => {

  });
});