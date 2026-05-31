const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

const { app } = require('../server');
const { Note } = require('../src/models/noteModel');
const aiService = require('../src/services/aiService');
const { createTestUser, createToken, authHeader } = require('./helpers/testAuth');

describe('AI summarizer', () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let noteA;
  let shortNote;

  before(async () => {
    userA = await createTestUser({
      username: 'summaryusera',
      email: 'summaryusera@example.com',
    });

    userB = await createTestUser({
      username: 'summaryuserb',
      email: 'summaryuserb@example.com',
    });

    tokenA = createToken(userA);
    tokenB = createToken(userB);

    noteA = await Note.create({
      user_id: userA.id,
      title: 'Long Note',
      content: '<p>This is a long enough note that should be summarised by the AI service.</p>',
    });

    shortNote = await Note.create({
      user_id: userA.id,
      title: 'Short Note',
      content: 'tiny',
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/summarize`);

    expect(res.status).to.equal(401);
  });

  it("should prevent another user from summarising someone else's note", async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/summarize`)
      .set(authHeader(tokenB));

    expect(res.status).to.equal(403);
  });

  it('should return an AI summary for the note owner', async () => {
    sinon.stub(aiService, 'summariseNote').resolves('This is a fake test summary.');

    const res = await request(app)
      .post(`/api/notes/${noteA.id}/summarize`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.summary).to.equal('This is a fake test summary.');
  });

  it('should return 502 when the AI service fails', async () => {
    const error = new Error('Gemini API request failed with status 503');
    error.status = 502;

    sinon.stub(aiService, 'summariseNote').rejects(error);

    const res = await request(app)
        .post(`/api/notes/${noteA.id}/summarize`)
        .set(authHeader(tokenA));

    expect(res.status).to.equal(502);
    expect(res.body.message).to.include('Gemini');
    });

  it('should return 400 when the AI service rejects short content', async () => {
    const error = new Error('Note content is too short to summarise.');
    error.status = 400;

    sinon.stub(aiService, 'summariseNote').rejects(error);

    const res = await request(app)
      .post(`/api/notes/${shortNote.id}/summarize`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('too short');
  });
});