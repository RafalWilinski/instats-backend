/* global it, describe, before, post, get */

const config = require('./config.json');
const request = require('supertest');
const expect = require('chai').expect;
const postgres = require('./postgres');
const app = require('./app');

const testInstagramId = config.instagram_test_id;

describe('API Integration Tests', () => {

  before((done) => {

  });

  it('Healthcheck responds OK status', () => {

  });

  it('Fetches stats using instagram API', () => {

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