/* global it, describe, before, post, get */

const request = require('supertest');
const fs = require('fs');
const expect = require('chai').expect;
const config = require('./config.js');
const postgres = require('./postgres');
const app = require('./app');
const instagramApi = require('./instagram');

const testInstagramId = config('instagram_test_id');
const testInstagramAccessToken = config('instagram_test_access_token');

describe('Config tests', () => {
  before(() => {
    process.env.TEST_VARIABLE = 'abc';
  });

  it('Gets variable from config.json', () => {
    expect(config('knex_debug')).to.be.equal(true);
  });

  it('Gets variable from environment if config is not available', () => {
    expect(config('test_variable')).to.be.equal('abc');
  });
});

describe('API Integration Tests', () => {

  before((done) => {
    done();
  });

  it('Healthcheck responds OK status', () => {
    request(app).get('/healthcheck');
  });

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

  it('Fetches followers', () => {

  });

  it('Fetches follows', () => {

  });

  it('Fetches smart profile', () => {

  });

  it('Promotes user', () => {

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