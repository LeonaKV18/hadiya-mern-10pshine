const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

const { app } = require('../server');
const { Note } = require('../src/models/noteModel');
const exportService = require('../src/services/exportService');
const { createTestUser, createToken, authHeader } = require('./helpers/testAuth');

describe('Note export', () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let noteA;

  before(async () => {
    userA = await createTestUser({
      username: 'exportusera',
      email: 'exportusera@example.com',
    });

    userB = await createTestUser({
      username: 'exportuserb',
      email: 'exportuserb@example.com',
    });

    tokenA = createToken(userA);
    tokenB = createToken(userB);

    noteA = await Note.create({
      user_id: userA.id,
      title: 'Export Note',
      content: '<p>This is export content.</p>',
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteA.id}/export?format=pdf`);

    expect(res.status).to.equal(401);
  });

  it('should reject invalid export format', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteA.id}/export?format=txt`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('Format');
  });

  it('should prevent another user from exporting someone else’s note', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteA.id}/export?format=pdf`)
      .set(authHeader(tokenB));

    expect(res.status).to.equal(403);
  });

  it('should export a note as PDF', async () => {
    sinon.stub(exportService, 'generatePdf').resolves(Buffer.from('%PDF fake test pdf'));

    const res = await request(app)
      .get(`/api/notes/${noteA.id}/export?format=pdf`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('application/pdf');
    expect(res.headers['content-disposition']).to.include('.pdf');
  });

  it('should export a note as DOCX', async () => {
    sinon.stub(exportService, 'generateDocx').resolves(Buffer.from('fake docx data'));

    const res = await request(app)
      .get(`/api/notes/${noteA.id}/export?format=docx`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(res.headers['content-disposition']).to.include('.docx');
  });
});