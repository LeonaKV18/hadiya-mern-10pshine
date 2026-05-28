const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');

require('../src/models/noteModel');
require('../src/models/folderModel');
require('../src/models/attachmentModel');

describe('GET / — health check', () => {
  it('should return 200 with a running message', async () => {
    const res = await request(app).get('/');

    expect(res.status).to.equal(200);
    expect(res.body.message).to.include('PlumPad');
  });

  it('should return JSON content-type', async () => {
    const res = await request(app).get('/');

    expect(res.headers['content-type']).to.include('application/json');
  });
});